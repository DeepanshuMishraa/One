import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const LAST_UPDATED = "May 20, 2025";

export default function TermsOfService() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-auto bg-white dark:bg-[#111111]">
      <div className="relative z-10 flex flex-grow flex-col">
        {/* Back Button */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8">
          <Link preload="intent" to="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-16">
          <Card className="overflow-hidden rounded-xl border-none bg-gray-50/80 dark:bg-transparent">
            <CardHeader className="space-y-4 px-8 py-8">
              <div className="space-y-2 text-center">
                <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl dark:text-white">
                  Terms of Service
                </CardTitle>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    Last updated: {LAST_UPDATED}
                  </p>
                </div>
              </div>
            </CardHeader>

            <div className="space-y-8 p-8">
              {sections.map((section) => {
                return (
                  <div key={section.title} id={section.title} className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {section.title}
                      </h2>
                    </div>
                    <div className="prose prose-sm prose-a:text-blue-600 hover:prose-a:text-blue-800 dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300 max-w-none text-gray-600 dark:text-white/80">
                      {section.content}
                    </div>
                  </div>
                );
              })}

              <div className="mt-12 flex flex-wrap items-center justify-center gap-4"></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const sections = [
  {
    title: "Overview",
    content: (
      <p>
        One is an open-source calendar solution that enables users to self-host
        their calendar service or integrate with external calendar providers. By
        using One, you agree to these terms.
      </p>
    ),
  },
  {
    title: "Service Description",
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-card-foreground mb-3 text-xl font-medium">
            Self-Hosted Service
          </h3>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              One provides software that users can deploy on their own
              infrastructure
            </li>
            <li>
              Users are responsible for their own hosting, maintenance, and
              compliance
            </li>
            <li>
              The software is provided &quot;as is&quot; under the MIT License
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-card-foreground mb-3 text-xl font-medium">
            External Calendar Integration
          </h3>
          <ul className="ml-4 list-disc space-y-2">
            <li>One can integrate with third-party calendar providers</li>
            <li>
              Users must comply with third-party providers&apos; terms of
              service
            </li>
            <li>We are not responsible for third-party service disruptions</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "User Responsibilities",
    content: (
      <div className="text-muted-foreground mt-4 space-y-3">
        <p>Users agree to:</p>
        <ul className="ml-4 list-disc space-y-2">
          <li>Comply with all applicable laws and regulations</li>
          <li>Maintain the security of their instance</li>
          <li>Not use the service for spam or malicious purposes</li>
          <li>Respect intellectual property rights</li>
          <li>Report security vulnerabilities responsibly</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Software License",
    content: (
      <div className="text-muted-foreground mt-4 space-y-3">
        <p>One is licensed under the MIT License:</p>
        <ul className="ml-4 list-disc space-y-2">
          <li>Users can freely use, modify, and distribute the software</li>
          <li>The software comes with no warranties</li>
          <li>Users must include the original license and copyright notice</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Community Guidelines",
    content: (
      <div className="text-muted-foreground mt-4 space-y-3">
        <p>Users participating in our community agree to:</p>
        <ul className="ml-4 list-disc space-y-2">
          <li>Follow our code of conduct</li>
          <li>Contribute constructively to discussions</li>
          <li>Respect other community members</li>
          <li>Report inappropriate behavior</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Contact Information",
    content: (
      <div className="text-muted-foreground mt-4 space-y-3">
        <p>For questions about these terms:</p>
        <div className="flex flex-col space-y-2">
          <a
            href="https://github.com/DeepanshuMishraa/One"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <Github className="mr-2 h-4 w-4" />
            Open an issue on GitHub
          </a>
        </div>
      </div>
    ),
  },
];
