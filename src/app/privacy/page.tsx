import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-extrabold tracking-tight font-display mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.
                (Note: This is a placeholder Privacy Policy page. A complete legal document will be added in a future update.)
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-3">2. How We Use Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect about you to provide, maintain, and improve our services, develop new features, protect StudySync AI and our users, and analyze how you use our services.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
