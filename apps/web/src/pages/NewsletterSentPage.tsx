import { useParams, useSearchParams } from 'react-router-dom';
import { Wand2, Twitter, Linkedin, Facebook } from 'lucide-react';
import { SuccessScreen } from '@/components/SuccessScreen';

export function NewsletterSentPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const recipientCount = Number(searchParams.get('recipients') || 0);

  return (
    <SuccessScreen
      title="Newsletter Sent!"
      message={
        recipientCount > 0
          ? `Your newsletter is on its way to ${recipientCount.toLocaleString()} ${recipientCount === 1 ? 'subscriber' : 'subscribers'}.`
          : "Your newsletter is on its way to your subscribers."
      }
      icon={Wand2}
      stats={[
        { label: 'Recipients', value: recipientCount > 0 ? recipientCount.toLocaleString() : '—' },
        { label: 'Status', value: 'Delivered' },
      ]}
      actions={[
        { label: 'View Analytics', href: '/analytics', primary: true },
        { label: 'Create Another', href: '/wizard' },
        { label: 'Generate Social Posts', href: `/newsletters/${id}/social` },
      ]}
    >
      {/* Social share prompt */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
          Share that you published!
        </p>
        <div className="flex gap-2 justify-center">
          <a
            href="https://twitter.com/intent/tweet?text=Just+sent+a+newsletter+with+Newsletter+Wizard+%F0%9F%AA%84"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            <Twitter className="w-3.5 h-3.5" />
            Twitter/X
          </a>
          <a
            href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fnewsletterwizard.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0077B5] text-white rounded-lg text-xs font-medium hover:bg-[#006399] transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
          <a
            href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fnewsletterwizard.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1877F2] text-white rounded-lg text-xs font-medium hover:bg-[#166FE5] transition-colors"
          >
            <Facebook className="w-3.5 h-3.5" />
            Facebook
          </a>
        </div>
      </div>
    </SuccessScreen>
  );
}
