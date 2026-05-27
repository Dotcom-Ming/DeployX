import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DocsShell } from '@/components/docs-shell';
import DocsHome from '@/app/page';
import GettingStartedPage from '@/app/getting-started/page';
import CLIPage from '@/app/cli/page';
import APIReferencePage from '@/app/api-reference/page';
import DeploymentsPage from '@/app/deployments/page';
import DomainsPage from '@/app/domains/page';
import EnvVariablesPage from '@/app/env-variables/page';
import BillingPage from '@/app/billing/page';
import NextjsGuidePage from '@/app/guides/nextjs/page';
import NuxtGuidePage from '@/app/guides/nuxt/page';
import ViteGuidePage from '@/app/guides/vite/page';

function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DocsLayout><DocsHome /></DocsLayout>} />
        <Route path="/getting-started" element={<DocsLayout><GettingStartedPage /></DocsLayout>} />
        <Route path="/cli" element={<DocsLayout><CLIPage /></DocsLayout>} />
        <Route path="/api-reference" element={<DocsLayout><APIReferencePage /></DocsLayout>} />
        <Route path="/deployments" element={<DocsLayout><DeploymentsPage /></DocsLayout>} />
        <Route path="/domains" element={<DocsLayout><DomainsPage /></DocsLayout>} />
        <Route path="/env-variables" element={<DocsLayout><EnvVariablesPage /></DocsLayout>} />
        <Route path="/billing" element={<DocsLayout><BillingPage /></DocsLayout>} />
        <Route path="/guides/nextjs" element={<DocsLayout><NextjsGuidePage /></DocsLayout>} />
        <Route path="/guides/nuxt" element={<DocsLayout><NuxtGuidePage /></DocsLayout>} />
        <Route path="/guides/vite" element={<DocsLayout><ViteGuidePage /></DocsLayout>} />
      </Routes>
    </BrowserRouter>
  );
}
