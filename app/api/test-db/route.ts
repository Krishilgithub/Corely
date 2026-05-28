import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const workspaceId = (await prisma.workspace.findFirst())?.id;
    if (!workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const totalDocuments = await prisma.document.count({ where: { workspaceId } });
    const totalSources = await prisma.source.count({ where: { workspaceId } });
    
    // Test Insights
    let insights = await prisma.dashboardInsight.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    if (insights.length === 0) {
      const dummyInsights = [
        { workspaceId, priority: "HIGH", title: "Test", description: "Test", source: "Salesforce", iconType: "TrendingDown" }
      ];
      await prisma.dashboardInsight.createMany({ data: dummyInsights });
      insights = await prisma.dashboardInsight.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 4 });
    }

    return NextResponse.json({ success: true, totalDocuments, totalSources, insights });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
