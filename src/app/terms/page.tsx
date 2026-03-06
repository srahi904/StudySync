import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <div className="container max-w-3xl py-12 px-4 md:px-6 flex-1">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 gap-2 -ml-3">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight font-display mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using StudySync AI, you accept and agree to be bound by the terms and provision of this agreement.
                (Note: This is a placeholder Terms of Service page. A complete legal document will be added in a future update.)
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-3">2. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to use the Service to upload, post, transmit, or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, or otherwise objectionable.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
