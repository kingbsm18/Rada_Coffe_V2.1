import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ModuleWorkspace } from '@/components/operations/module-workspace'
import { getOperationsModule } from '@/lib/operations/modules'

type PageProps = { params: Promise<{ module: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { module: slug } = await params
  const module = getOperationsModule(slug)
  return { title: module ? `${module.title} | RADA Coffee` : 'Operations | RADA Coffee', description: module?.description ?? 'RADA Coffee operations workspace.' }
}

export default async function OperationsModulePage({ params }: PageProps) {
  const { module: slug } = await params
  const module = getOperationsModule(slug)
  if (!module) notFound()
  return <ModuleWorkspace module={module} />
}
