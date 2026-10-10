"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ProductType } from "@prisma/client"

const ProductSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  code: z.string().min(1, "Kode/SKU wajib diisi"),
  name: z.string().min(1, "Nama produk wajib diisi"),
  type: z.enum(["RAW_MATERIAL", "SEMI_FINISHED", "FINISHED_GOOD"]),
  unit: z.string().min(1, "Satuan ukuran (UoM) wajib diisi"),
  standardCost: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
})

export type ProductInput = {
  id?: string
  categoryId: string
  code?: string
  sku?: string
  name: string
  type: "RAW_MATERIAL" | "SEMI_FINISHED" | "FINISHED_GOOD"
  unit?: string
  uom?: string
  standardCost?: number
  costPrice?: number
  sellingPrice?: number | null
  isActive?: boolean
}

// === HELPER: DEFAULT CATEGORIES SEEDER ===
export async function ensureDefaultCategories() {
  const count = await prisma.productCategory.count()
  if (count === 0) {
    const defaults = [
      { name: "Makanan Utama", slug: "makanan-utama" },
      { name: "Minuman & Jus", slug: "minuman-jus" },
      { name: "Dessert & Olahan Strawberry", slug: "dessert-strawberry" },
      { name: "Bahan Baku Segar", slug: "bahan-baku-segar" },
      { name: "Bumbu & Sirup", slug: "bumbu-sirup" },
      { name: "Packaging & Perlengkapan", slug: "packaging-perlengkapan" },
    ]

    for (const cat of defaults) {
      await prisma.productCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    }
  }

  return await prisma.productCategory.findMany({
    orderBy: { name: "asc" },
  })
}

// === KATEGORI PRODUK ===

export async function getProductCategories() {
  return await ensureDefaultCategories()
}

export async function createProductCategory(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) throw new Error("Akses ditolak")

  const name = formData.get("name") as string
  if (!name || name.trim().length === 0) throw new Error("Nama kategori wajib diisi")

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  const category = await prisma.productCategory.create({
    data: { name: name.trim(), slug },
  })

  await auditLog("CREATE", "ProductCategory", category.id, { name, slug }, user.id)
  revalidatePath("/products")
  revalidatePath("/products/categories")
}

// === MASTER PRODUK ===

export async function getProducts(type?: "RAW_MATERIAL" | "SEMI_FINISHED" | "FINISHED_GOOD") {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  await ensureDefaultCategories()

  const products = await prisma.productItem.findMany({
    where: type ? { type: type as ProductType } : undefined,
    include: {
      category: true,
      recipeAsFinished: {
        include: {
          ingredients: {
            include: { rawMaterial: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  // Normalize mapping for compatibility with both schema & user aliases (sku -> code, costPrice -> standardCost, recipe -> recipeAsFinished)
  return products.map((p) => ({
    ...p,
    sku: p.code,
    costPrice: p.standardCost,
    uom: p.unit,
    sellingPrice: p.sellingPrice || 0,
    recipe: p.recipeAsFinished,
  }))
}

export async function getProductById(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  const product = await prisma.productItem.findUnique({
    where: { id },
    include: {
      category: true,
      recipeAsFinished: {
        include: {
          ingredients: {
            include: { rawMaterial: true },
          },
        },
      },
    },
  })

  if (!product) return null

  return {
    ...product,
    sku: product.code,
    costPrice: product.standardCost,
    uom: product.unit,
    sellingPrice: product.sellingPrice || 0,
    recipe: product.recipeAsFinished,
  }
}

export async function upsertProduct(data: ProductInput) {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) throw new Error("Akses ditolak")

  // Support both user alias fields (sku, costPrice, uom) and schema fields (code, standardCost, unit)
  const normalizedCode = data.code || data.sku || ""
  const normalizedCost = data.standardCost !== undefined ? data.standardCost : (data.costPrice || 0)
  const normalizedUnit = data.unit || data.uom || "PCS"
  const normalizedSelling = data.sellingPrice !== undefined ? data.sellingPrice : 0

  const validated = ProductSchema.parse({
    id: data.id,
    categoryId: data.categoryId,
    code: normalizedCode,
    name: data.name,
    type: data.type,
    unit: normalizedUnit,
    standardCost: normalizedCost,
    sellingPrice: normalizedSelling,
    isActive: data.isActive ?? true,
  })

  let product

  if (validated.id) {
    product = await prisma.productItem.update({
      where: { id: validated.id },
      data: {
        categoryId: validated.categoryId,
        code: validated.code,
        name: validated.name,
        type: validated.type as ProductType,
        unit: validated.unit,
        standardCost: validated.standardCost,
        sellingPrice: validated.sellingPrice,
        isActive: validated.isActive,
      },
    })
    await auditLog("UPDATE", "ProductItem", validated.id, validated, user.id)
  } else {
    product = await prisma.productItem.create({
      data: {
        categoryId: validated.categoryId,
        code: validated.code,
        name: validated.name,
        type: validated.type as ProductType,
        unit: validated.unit,
        standardCost: validated.standardCost,
        sellingPrice: validated.sellingPrice,
        isActive: validated.isActive,
      },
    })
    await auditLog("CREATE", "ProductItem", product.id, validated, user.id)
  }

  revalidatePath("/products")
  revalidatePath("/operations")
  revalidatePath("/operations/inventory")

  return {
    ...product,
    sku: product.code,
    costPrice: product.standardCost,
    uom: product.unit,
    sellingPrice: product.sellingPrice || 0,
  }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) throw new Error("Akses ditolak")

  await prisma.productItem.delete({
    where: { id },
  })

  await auditLog("DELETE", "ProductItem", id, null, user.id)
  revalidatePath("/products")
}

// === RESEP & BILL OF MATERIALS (BOM) ===

export async function calculateRecipeCost(recipeId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  // Hitung ulang Food Cost % berdasarkan harga bahan baku terbaru
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: {
        include: { rawMaterial: true },
      },
      finishedProduct: true,
    },
  })

  if (!recipe) throw new Error("Resep tidak ditemukan")

  let totalIngredientsCost = 0
  for (const item of recipe.ingredients) {
    // Asumsi harga per unit bahan baku dari standardCost atau costPerUnit
    const unitPrice = item.costPerUnit > 0 ? item.costPerUnit : item.rawMaterial.standardCost
    totalIngredientsCost += unitPrice * item.quantity
  }

  const yieldQty = recipe.yieldQuantity > 0 ? recipe.yieldQuantity : 1
  const costPerPortion = (totalIngredientsCost + recipe.laborCostEstimate) / yieldQty

  // Update totalHpp pada resep dan standardCost produk akhir (FINISHED_GOOD)
  await prisma.recipe.update({
    where: { id: recipeId },
    data: { totalHpp: costPerPortion },
  })

  await prisma.productItem.update({
    where: { id: recipe.finishedProductId },
    data: { standardCost: costPerPortion },
  })

  const sellingPrice = recipe.finishedProduct.sellingPrice || 0
  const foodCostPercentage = sellingPrice > 0 ? (costPerPortion / sellingPrice) * 100 : 0

  await auditLog(
    "UPDATE",
    "Recipe",
    recipeId,
    {
      totalCost: costPerPortion,
      totalIngredientsCost,
      foodCostPercentage,
    },
    user.id
  )

  revalidatePath("/products")
  revalidatePath("/products/recipes")

  return {
    totalCost: costPerPortion,
    totalIngredientsCost,
    foodCostPercentage,
  }
}

export async function upsertRecipe(data: {
  finishedProductId: string
  yieldQuantity?: number
  yieldUnit?: string
  laborCostEstimate?: number
  ingredients: {
    rawMaterialId: string
    quantity: number
    unit: string
    costPerUnit?: number
  }[]
}) {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) throw new Error("Akses ditolak")

  const product = await prisma.productItem.findUnique({
    where: { id: data.finishedProductId },
  })

  if (!product) throw new Error("Produk jadi tidak ditemukan")

  let recipe = await prisma.recipe.findUnique({
    where: { finishedProductId: data.finishedProductId },
  })

  if (recipe) {
    // Hapus ingredient lama dan re-create
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: recipe.id },
    })

    recipe = await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        yieldQuantity: data.yieldQuantity || 1,
        yieldUnit: data.yieldUnit || "PORSI",
        laborCostEstimate: data.laborCostEstimate || 0,
        ingredients: {
          create: data.ingredients.map((ing) => ({
            rawMaterialId: ing.rawMaterialId,
            quantity: ing.quantity,
            unit: ing.unit,
            costPerUnit: ing.costPerUnit || 0,
          })),
        },
      },
    })
  } else {
    recipe = await prisma.recipe.create({
      data: {
        finishedProductId: data.finishedProductId,
        yieldQuantity: data.yieldQuantity || 1,
        yieldUnit: data.yieldUnit || "PORSI",
        laborCostEstimate: data.laborCostEstimate || 0,
        ingredients: {
          create: data.ingredients.map((ing) => ({
            rawMaterialId: ing.rawMaterialId,
            quantity: ing.quantity,
            unit: ing.unit,
            costPerUnit: ing.costPerUnit || 0,
          })),
        },
      },
    })
  }

  // Hitung ulang biaya otomatis
  await calculateRecipeCost(recipe.id)

  revalidatePath("/products")
  revalidatePath("/products/recipes")
  return recipe
}
