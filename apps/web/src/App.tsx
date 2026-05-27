import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { SentryProvider } from '@/components/providers/sentry-provider';
import { Toaster } from 'sonner';
import AuthLayout from '@/app/(auth)/layout';
import OrgLayout from '@/app/[org]/layout';
import ProjectLayout from '@/app/[org]/projects/[id]/layout';
import HomePage from '@/app/page';
import LoginPage from '@/app/(auth)/login/page';
import SignupPage from '@/app/(auth)/signup/page';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import ResetPasswordPage from '@/app/(auth)/reset-password/page';
import VerifyEmailPage from '@/app/(auth)/verify-email/page';
import OAuthCallbackPage from '@/app/(auth)/oauth/callback/page';
import DashboardPage from '@/app/[org]/dashboard/page';
import ProjectsPage from '@/app/[org]/projects/page';
import NewProjectPage from '@/app/[org]/projects/new/page';
import ProjectDetailPage from '@/app/[org]/projects/[id]/page';
import ProjectDeploymentsPage from '@/app/[org]/projects/[id]/deployments/page';
import DeploymentDetailPage from '@/app/[org]/projects/[id]/deployments/[did]/page';
import AnalyticsPage from '@/app/[org]/projects/[id]/analytics/page';
import LogsPage from '@/app/[org]/projects/[id]/logs/page';
import StoragePage from '@/app/[org]/projects/[id]/storage/page';
import EnvPage from '@/app/[org]/projects/[id]/env/page';
import DomainsPage from '@/app/[org]/projects/[id]/domains/page';
import ProjectSettingsPage from '@/app/[org]/projects/[id]/settings/page';
import DeploymentsPage from '@/app/[org]/deployments/page';
import ActivityPage from '@/app/[org]/activity/page';
import TeamPage from '@/app/[org]/team/page';
import OrgSettingsPage from '@/app/[org]/settings/page';
import BillingPage from '@/app/[org]/billing/page';
import UsagePage from '@/app/[org]/usage/page';
import AuditLogPage from '@/app/[org]/audit-log/page';

function AuthRoute({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}

function OrgRoute({ children }: { children: React.ReactNode }) {
  return <OrgLayout>{children}</OrgLayout>;
}

function ProjectRoute({ children }: { children: React.ReactNode }) {
  return <OrgLayout><ProjectLayout>{children}</ProjectLayout></OrgLayout>;
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SentryProvider />
        <QueryProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />
            <Route path="/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />
            <Route path="/reset-password" element={<AuthRoute><ResetPasswordPage /></AuthRoute>} />
            <Route path="/verify-email" element={<AuthRoute><VerifyEmailPage /></AuthRoute>} />
            <Route path="/oauth/callback" element={<AuthRoute><OAuthCallbackPage /></AuthRoute>} />
            <Route path="/:org" element={<OrgRoute><DashboardPage /></OrgRoute>} />
            <Route path="/:org/dashboard" element={<OrgRoute><DashboardPage /></OrgRoute>} />
            <Route path="/:org/projects" element={<OrgRoute><ProjectsPage /></OrgRoute>} />
            <Route path="/:org/projects/new" element={<OrgRoute><NewProjectPage /></OrgRoute>} />
            <Route path="/:org/projects/:id" element={<ProjectRoute><ProjectDetailPage /></ProjectRoute>} />
            <Route path="/:org/projects/:id/deployments" element={<ProjectRoute><ProjectDeploymentsPage /></ProjectRoute>} />
            <Route path="/:org/projects/:id/deployments/:did" element={<ProjectRoute><DeploymentDetailPage /></ProjectRoute>} />
            <Route path="/:org/projects/:id/analytics" element={<ProjectRoute><AnalyticsPage /></ProjectRoute>} />
            <Route path="/:org/projects/:id/logs" element={<ProjectRoute><LogsPage /></ProjectRoute>} />
            <Route path="/:org/projects/:id/storage" element={<ProjectRoute><StoragePage /></ProjectRoute>} />
            <Route path="/:org/projects/:id/env" element={<ProjectRoute><EnvPage /></ProjectRoute>} />
            <Route path="/:org/projects/:id/domains" element={<ProjectRoute><DomainsPage /></ProjectRoute>} />
            <Route path="/:org/projects/:id/settings" element={<ProjectRoute><ProjectSettingsPage /></ProjectRoute>} />
            <Route path="/:org/deployments" element={<OrgRoute><DeploymentsPage /></OrgRoute>} />
            <Route path="/:org/activity" element={<OrgRoute><ActivityPage /></OrgRoute>} />
            <Route path="/:org/team" element={<OrgRoute><TeamPage /></OrgRoute>} />
            <Route path="/:org/settings" element={<OrgRoute><OrgSettingsPage /></OrgRoute>} />
            <Route path="/:org/billing" element={<OrgRoute><BillingPage /></OrgRoute>} />
            <Route path="/:org/usage" element={<OrgRoute><UsagePage /></OrgRoute>} />
            <Route path="/:org/audit-log" element={<OrgRoute><AuditLogPage /></OrgRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster richColors position="bottom-right" />
        </QueryProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
