import { Callout } from "../../components/callout";

const plans = [
  {
    name: "Hobby",
    price: "Free",
    features: [
      "3 projects",
      "1 GB bandwidth / month",
      "100 GB-hours compute / month",
      "Automatic SSL",
      "Community support",
      "1 team member",
    ],
  },
  {
    name: "Pro",
    price: "$20/member/month",
    features: [
      "Unlimited projects",
      "100 GB bandwidth / month",
      "1,000 GB-hours compute / month",
      "Custom domains",
      "Preview deployments",
      "Password-protected deployments",
      "Priority support",
      "Up to 10 team members",
      "Analytics dashboard",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    price: "$50/member/month",
    features: [
      "Everything in Pro",
      "1 TB bandwidth / month",
      "10,000 GB-hours compute / month",
      "99.99% uptime SLA",
      "SSO / SAML",
      "Advanced analytics",
      "Audit logs",
      "Unlimited team members",
      "Dedicated support engineer",
      "Custom regions",
    ],
  },
];

export default function BillingPage() {
  return (
    <div>
      <h1>Billing</h1>
      <p>
        DeployX offers flexible pricing plans for individuals and teams. All
        plans include automatic SSL, global CDN, and continuous deployment.
      </p>

      <h2>Plans</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              padding: "1.5rem",
              borderRadius: "12px",
              border: plan.highlighted
                ? "2px solid var(--color-primary)"
                : "1px solid var(--color-border)",
              background: plan.highlighted
                ? "var(--color-primary-light)"
                : "var(--color-bg-secondary)",
            }}
          >
            <h3 style={{ marginBottom: "0.25rem" }}>{plan.name}</h3>
            <p
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--color-text)",
                marginBottom: "1rem",
              }}
            >
              {plan.price}
            </p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  style={{
                    padding: "0.25rem 0",
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    gap: "0.375rem",
                  }}
                >
                  <span style={{ color: "var(--color-success)" }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2>Usage-Based Billing</h2>
      <p>
        All plans include generous base allowances. If you exceed your plan&apos;s
        included usage, additional usage is billed at the following rates:
      </p>
      <table>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bandwidth</td>
            <td>$0.10 / GB</td>
          </tr>
          <tr>
            <td>Compute</td>
            <td>$0.0000183 / GB-second</td>
          </tr>
          <tr>
            <td>Preview deployments</td>
            <td>Included (all plans)</td>
          </tr>
          <tr>
            <td>Custom domains</td>
            <td>Included (Pro and above)</td>
          </tr>
        </tbody>
      </table>

      <h2>Managing Your Subscription</h2>
      <p>
        You can manage your subscription, view invoices, and update payment
        methods from the DeployX dashboard:
      </p>
      <ul>
        <li>
          <strong>Upgrade:</strong> Navigate to Settings → Billing → Change
          Plan. Upgrades take effect immediately.
        </li>
        <li>
          <strong>Downgrade:</strong> Downgrades take effect at the end of
          your current billing cycle.
        </li>
        <li>
          <strong>Cancel:</strong> You can cancel at any time. Your projects
          will remain active until the end of the billing period.
        </li>
      </ul>

      <Callout variant="info" title="Annual Billing">
        Save 20% by choosing annual billing. Contact{" "}
        <a href="mailto:sales@deployx.com">sales@deployx.com</a> for custom
        enterprise pricing.
      </Callout>

      <h2>Invoices</h2>
      <p>
        Invoices are generated at the start of each billing cycle and are
        available in the dashboard under Settings → Billing → Invoices.
        Usage-based charges appear on the following month&apos;s invoice.
      </p>

      <h2>Payment Methods</h2>
      <p>DeployX accepts the following payment methods:</p>
      <ul>
        <li>Credit cards (Visa, Mastercard, American Express)</li>
        <li>Debit cards</li>
        <li>Wire transfer (Business plan, annual billing)</li>
      </ul>
    </div>
  );
}
