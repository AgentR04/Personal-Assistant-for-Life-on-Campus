"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { ArrowRight, Loader2, Search, Sparkles, User } from "lucide-react";
import { useState } from "react";

export function ProjectMatcher() {
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const handleMatch = async () => {
    if (!interests.trim()) return;

    setLoading(true);
    try {
      const res = await api.projects.match(interests);
      if (res.data.success) {
        setMatchResult(res.data.data);
      }
    } catch (error) {
      console.error("Failed to match projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
            Zero-Day Project Matchmaker
          </CardTitle>
          <CardDescription>
            Tell us what you're interested in (e.g., "I love AI and Python" or
            "I want to build robots"), and we'll use Gemini to find your perfect
            campus project instantly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Textarea
              placeholder="I'm interested in..."
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="min-h-[80px] text-lg"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            onClick={handleMatch}
            disabled={loading || !interests.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                Find My Match <Search className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {matchResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Extracted Skills:</span>
            <div className="flex flex-wrap gap-1">
              {matchResult.extractedSkills.map((skill: string) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="text-xs bg-background"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Best Match */}
            <Card className="md:col-span-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 bg-green-500 text-white text-xs font-bold rounded-bl-xl">
                {matchResult.bestMatch.matchScore}% MATCH
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {matchResult.bestMatch.projectName}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {matchResult.bestMatch.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-background/80 p-4 rounded-xl border border-border/50 italic text-muted-foreground">
                  " {matchResult.bestMatch.introduction} "
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {matchResult.bestMatch.seniorLead.name}
                    </span>
                    <span className="text-muted-foreground">
                      ({matchResult.bestMatch.seniorLead.year})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium text-xs">
                      {matchResult.bestMatch.openSlots} Slots Open
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700">
                  Connect with{" "}
                  {matchResult.bestMatch.seniorLead.name.split(" ")[0]}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Other Matches */}
            {matchResult.allMatches
              .slice(1)
              .map((match: any, index: number) => (
                <Card
                  key={index}
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">
                        {match.projectName}
                      </CardTitle>
                      <Badge variant="secondary">{match.score}%</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
