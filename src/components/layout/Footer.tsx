import { Link } from 'react-router';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-primary border-t border-surface-border mt-auto">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-xl text-neutral-900 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontStyle: 'italic' }}>Foilio</span>
            <span className="text-xs text-neutral-500">
              © {currentYear} Foilio. All rights reserved.
            </span>
          </div>

          {/* Legal links */}
          <div className="flex items-center gap-4 text-xs text-neutral-500">
            <Link to="/privacy" className="hover:text-primary-500 underline underline-offset-2 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary-500 underline underline-offset-2 transition-colors">
              Terms of Service
            </Link>
            <Link to="/settings/support" className="hover:text-primary-500 underline underline-offset-2 transition-colors">
              Support
            </Link>
          </div>

        </div>

        {/* Disclaimer */}
        <div className="mt-6 pt-4 border-t border-surface-border">
          <p className="text-xs text-neutral-400 text-center">
            Wizards of the Coast, Magic: The Gathering, and their logos are trademarks of Wizards of the Coast LLC.
            This site is not affiliated with or endorsed by Wizards of the Coast.
          </p>
        </div>
      </div>
    </footer>
  );
}
