'use client'
// src/app/(dashboard)/materials/upload/page.tsx
import { UploadForm } from '@/components/materials/upload-form'
import { ArrowLeft, BookOpen, Info } from 'lucide-react'
import Link from 'next/link'

export default function UploadMaterialPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/materials"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Materials
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold">Upload Material</h1>
            <p className="text-sm text-muted-foreground">Share your study materials with the community</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-blue-500">Review Process</p>
          <p className="text-muted-foreground mt-0.5">
            Public materials will be reviewed before appearing in the public library. 
            Private materials are available to you immediately.
          </p>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <UploadForm />
      </div>
    </div>
  )
}
