import { getMarketingOverview } from "@/modules/marketing/actions/marketing-actions"
import { getCurrentUser, isManagerOrAbove } from "@/shared/lib/auth"
import { getEffectiveOutlet } from "@/shared/lib/outlet-context"
import { redirect } from "next/navigation"
import { prisma } from "@/shared/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Star, Share2, Users, MessageSquare } from "lucide-react"
import ReviewFormDialog from "@/components/marketing/ReviewFormDialog"
import CampaignFormDialog from "@/components/marketing/CampaignFormDialog"
import CustomerVisitModal from "@/components/marketing/CustomerVisitModal"
import ServiceRecoveryActions from "@/components/marketing/ServiceRecoveryActions"

export const metadata = {
  title: "Marketing & Reputasi | IBMS",
}

export default async function MarketingDashboard() {
  const user = await getCurrentUser()
  if (!user || !isManagerOrAbove(user)) redirect("/")

  const effectiveOutlet = await getEffectiveOutlet(user)
  const outletId = effectiveOutlet.outletId

  const [marketingData, outlets] = await Promise.all([
    getMarketingOverview(outletId),
    prisma.outlet.findMany({ where: { isActive: true } }),
  ])

  const {
    reviews,
    campaigns,
    avgRating,
    totalServiceRecoveryPending,
    totalVisitorsCount,
    attributionList,
    activeCampaigns,
  } = marketingData



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing & Reputasi</h1>
          <p className="text-muted-foreground">
            Kelola ulasan tamu, atribusi channel kedatangan tanpa diskon, dan kalender konten organik.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CustomerVisitModal outlets={outlets} defaultOutletId={outletId} />
          <ReviewFormDialog outlets={outlets} defaultOutletId={outletId} />
          <CampaignFormDialog />
        </div>
      </div>

      {/* KPI Cards Ringkasan Marketing */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Rata-rata</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)} / 5.0</div>
            <p className="text-xs text-muted-foreground">Dari Google Maps & In-Store</p>
          </CardContent>
        </Card>

        <Card
          className={
            totalServiceRecoveryPending > 0
              ? "border-red-200 bg-red-50/50"
              : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-sm font-medium ${
                totalServiceRecoveryPending > 0 ? "text-red-800" : ""
              }`}
            >
              Service Recovery SLA
            </CardTitle>
            <MessageSquare
              className={`h-4 w-4 ${
                totalServiceRecoveryPending > 0 ? "text-red-600" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalServiceRecoveryPending > 0 ? "text-red-700" : "text-slate-900"
              }`}
            >
              {totalServiceRecoveryPending} Tertunda
            </div>
            <p
              className={`text-xs ${
                totalServiceRecoveryPending > 0 ? "text-red-600/80 font-medium" : "text-muted-foreground"
              }`}
            >
              {totalServiceRecoveryPending > 0
                ? "Komplain butuh tindak lanjut segera"
                : "Semua komplain telah diselesaikan"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kunjungan (Bulan ini)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitorsCount} Pax</div>
            <p className="text-xs text-muted-foreground">Atribusi tamu dari seluruh channel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konten Organik Aktif</CardTitle>
            <Share2 className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns.length} Jadwal</div>
            <p className="text-xs text-muted-foreground">Kampanye media sosial berjalan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Atribusi Channel Kedatangan Tamu */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Sumber Kedatangan Tamu</CardTitle>
            <CardDescription className="text-xs">
              Atribusi channel organik tanpa perang harga / diskon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {attributionList.map((item) => {
                const percentage =
                  totalVisitorsCount > 0
                    ? Math.round((item.count / totalVisitorsCount) * 100)
                    : 0
                return (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.channel}</span>
                      <span className="text-slate-500 font-medium">
                        {item.count} pax ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.barColor}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ulasan & Service Recovery */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ulasan & Service Recovery SLA</CardTitle>
            <CardDescription className="text-xs">
              Pemantauan sentimen tamu dan tindakan penanganan komplain cepat.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rating</TableHead>
                    <TableHead className="w-[35%]">Ulasan Tamu</TableHead>
                    <TableHead>Pengulas</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Sentimen</TableHead>
                    <TableHead className="text-right">Tindakan SLA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                        Belum ada ulasan tamu tercatat. Klik tombol <b>Input Ulasan Tamu</b> untuk mencatat ulasan baru.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reviews.map((fb) => (
                      <TableRow key={fb.id} className="text-xs">
                        <TableCell>
                          <div className="flex items-center gap-1 font-bold">
                            <span>{fb.rating}</span>
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate" title={fb.reviewText || ""}>
                          {fb.reviewText || <span className="italic text-slate-400">Tanpa komentar</span>}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{fb.reviewerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {fb.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              fb.sentiment === "POSITIVE"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : fb.sentiment === "NEGATIVE"
                                ? "bg-red-100 text-red-800 border-red-200 font-semibold"
                                : "bg-slate-100 text-slate-800 border-slate-200"
                            }
                          >
                            {fb.sentiment}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ServiceRecoveryActions
                            reviewId={fb.id}
                            isResolved={fb.followUpStatus === "RESOLVED"}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Kalender Konten Organik */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Kalender Kampanye Konten Organik</CardTitle>
            <CardDescription className="text-xs">
              Jadwal publikasi media sosial untuk meningkatkan kunjungan dan brand positioning Ciwidey.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul Kampanye</TableHead>
                    <TableHead>Platform Media</TableHead>
                    <TableHead>Tanggal Rencana Publikasi</TableHead>
                    <TableHead>Konsep Tema</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                        Belum ada jadwal kampanye konten. Klik tombol <b>Jadwal Konten Baru</b> untuk merencanakan konten organik.
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((camp) => (
                      <TableRow key={camp.id} className="text-xs">
                        <TableCell className="font-semibold text-slate-900">{camp.title}</TableCell>
                        <TableCell>{camp.channel}</TableCell>
                        <TableCell>
                          {new Date(camp.plannedDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="max-w-md truncate text-slate-600">
                          {camp.themeConcept}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              camp.status === "ACTIVE"
                                ? "bg-[#2A7C13] text-white"
                                : camp.status === "COMPLETED"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-800"
                            }
                          >
                            {camp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
