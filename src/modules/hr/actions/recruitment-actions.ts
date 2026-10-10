"use server"

import { prisma } from "@/shared/lib/prisma"
import { auditLog } from "@/shared/lib/audit-logger"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { revalidatePath } from "next/cache"
import { CandidateStatus } from "@prisma/client"

export async function createRecruitmentJob(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!isManagerOrAbove(currentUser)) throw new Error("Akses ditolak")

  const title = formData.get("title") as string
  const divisionId = formData.get("divisionId") as string
  const outletId = (formData.get("outletId") as string) || null
  const requirements = formData.get("requirements") as string

  if (!title || !divisionId || !requirements) {
    throw new Error("Judul lowongan, divisi, dan kualifikasi wajib diisi")
  }

  const job = await prisma.recruitmentJob.create({
    data: {
      title,
      divisionId,
      outletId: outletId && outletId !== "ALL" ? outletId : null,
      requirements,
      status: "OPEN",
    },
  })

  await auditLog("CREATE", "RecruitmentJob", job.id, { title, divisionId }, currentUser?.id)
  revalidatePath("/hr/recruitment")
}

export async function submitCandidateApplication(formData: FormData) {
  const currentUser = await getCurrentUser()
  const jobId = formData.get("jobId") as string
  const candidateName = formData.get("candidateName") as string
  const phone = formData.get("phone") as string
  const email = (formData.get("email") as string) || null
  const resumeUrl = (formData.get("resumeUrl") as string) || null

  if (!jobId || !candidateName || !phone) {
    throw new Error("Data pelamar tidak lengkap")
  }

  const application = await prisma.candidateApplication.create({
    data: {
      jobId,
      candidateName,
      phone,
      email,
      resumeUrl,
      status: CandidateStatus.APPLIED,
    },
  })

  await auditLog("CREATE", "CandidateApplication", application.id, { candidateName }, currentUser?.id)
  revalidatePath("/hr/recruitment")
}

export async function submitInterviewScorecard(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!isManagerOrAbove(currentUser)) throw new Error("Akses ditolak")

  const applicationId = formData.get("applicationId") as string
  const technicalScore = parseInt(formData.get("technicalScore") as string) || 3
  const attitudeScore = parseInt(formData.get("attitudeScore") as string) || 3
  const cultureScore = parseInt(formData.get("cultureScore") as string) || 3
  const notes = (formData.get("notes") as string) || null
  const recommendation = formData.get("recommendation") as string // "HIRE", "CONSIDER", "REJECT"

  const scorecard = await prisma.interviewScorecard.create({
    data: {
      applicationId,
      interviewerId: currentUser!.id,
      technicalScore,
      attitudeScore,
      cultureScore,
      notes,
      recommendation,
    },
  })

  // Update status kandidat jika ada rekomendasi
  let newStatus: CandidateStatus = CandidateStatus.INTERVIEW
  if (recommendation === "HIRE") newStatus = CandidateStatus.OFFERED
  if (recommendation === "REJECT") newStatus = CandidateStatus.REJECTED

  await prisma.candidateApplication.update({
    where: { id: applicationId },
    data: { status: newStatus },
  })

  await auditLog("CREATE", "InterviewScorecard", scorecard.id, { recommendation, newStatus }, currentUser?.id)
  revalidatePath("/hr/recruitment")
}

export async function getRecruitmentJobs(outletId?: string) {
  return await prisma.recruitmentJob.findMany({
    where: outletId
      ? {
          OR: [{ outletId }, { outletId: null }],
        }
      : undefined,
    include: {
      division: true,
      outlet: true,
      candidates: {
        include: {
          scorecards: {
            include: { interviewer: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}
