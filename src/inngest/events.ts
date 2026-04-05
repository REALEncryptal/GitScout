export type Events = {
  "github/sync.requested": {
    data: { userId: string };
  };
  "github/sync.completed": {
    data: { userId: string; githubProfileId: string };
  };
  "profile/analyzed": {
    data: { userId: string; developerProfileId: string };
  };
  "repos/scouted": {
    data: { userId: string; scoutingRunId: string };
  };
  "recommendations/generated": {
    data: { userId: string; count: number };
  };
};
