import { getRecommendations } from "@/lib/actions/get-recommendations";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function RecommendationsPage() {
  const [allRecs, savedRecs] = await Promise.all([
    getRecommendations({ limit: 20 }),
    getRecommendations({ status: "saved", limit: 20 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <p className="mt-1 text-muted-foreground">
          Open-source projects where your skills are needed
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All ({allRecs.items.length})
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved ({savedRecs.items.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {allRecs.items.length > 0 ? (
            allRecs.items.map((rec) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                recommendation={rec.data}
                status={rec.status}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No recommendations yet. Start scouting from the dashboard.
            </p>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4 mt-4">
          {savedRecs.items.length > 0 ? (
            savedRecs.items.map((rec) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                recommendation={rec.data}
                status={rec.status}
              />
            ))
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No saved recommendations yet. Save recommendations you want to
              come back to.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
