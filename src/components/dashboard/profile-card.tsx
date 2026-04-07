import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DeveloperProfile } from "@/lib/ai/schemas/developer-profile";
import { Code, Brain, GitFork, Target, User } from "lucide-react";

interface ProfileCardProps {
  profile: DeveloperProfile;
  username: string;
}

const proficiencyColors: Record<string, string> = {
  expert: "bg-primary text-primary-foreground",
  advanced: "bg-primary/70 text-primary-foreground",
  intermediate: "bg-secondary text-secondary-foreground",
  beginner: "bg-muted text-muted-foreground",
};

export function ProfileCard({ profile, username }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <User className="h-4 w-4 shrink-0" />
          <span>Developer Profile</span>
          <Badge variant="outline" className="font-normal max-w-full truncate">
            @{username}
          </Badge>
        </CardTitle>
        <CardDescription>{profile.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Code className="h-3.5 w-3.5 text-muted-foreground" />
            Languages
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.primaryLanguages.map((lang) => (
              <Badge
                key={lang.language}
                className={proficiencyColors[lang.proficiencyLevel] ?? ""}
              >
                {lang.language}
                <span className="ml-1 opacity-70">
                  ({lang.proficiencyLevel})
                </span>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            Expertise Areas
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.expertiseAreas.map((area) => (
              <Badge key={area.area} variant="secondary">
                {area.area}
                <span className="ml-1 opacity-60">
                  {Math.round(area.confidence * 100)}%
                </span>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <GitFork className="h-3.5 w-3.5 text-muted-foreground" />
            Contribution Style
          </h4>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium capitalize">
              {profile.contributionStyle.type}
            </span>{" "}
            &mdash; {profile.contributionStyle.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.contributionStyle.preferredContributions.map((c) => (
              <Badge key={c} variant="outline" className="text-xs">
                {c}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            Ideal Projects
          </h4>
          <div className="flex flex-wrap gap-2">
            {profile.idealProjectTraits.map((trait) => (
              <Badge
                key={trait}
                variant="outline"
                className="h-auto max-w-full whitespace-normal text-left py-1 leading-snug"
              >
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
