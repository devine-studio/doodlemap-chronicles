import { useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  text: string;
  image_url?: string;
  created_at: string;
  author?: string;
  like_count?: number;
  comment_count?: number;
}

const PINS_PER_PAGE = 100;

export const usePinsQuery = () => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["pins"],
    queryFn: async ({ pageParam = 0 }) => {
      const { data: pinsData, error } = await supabase
        .from("pins")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageParam * PINS_PER_PAGE, (pageParam + 1) * PINS_PER_PAGE - 1);

      if (error) throw error;

      const pinsWithCounts = await Promise.all(
        (pinsData || []).map(async (pin) => {
          const [{ count: likeCount }, { count: commentCount }] =
            await Promise.all([
              supabase
                .from("likes")
                .select("*", { count: "exact", head: true })
                .eq("pin_id", pin.id),
              supabase
                .from("comments")
                .select("*", { count: "exact", head: true })
                .eq("pin_id", pin.id),
            ]);

          return {
            ...pin,
            like_count: likeCount || 0,
            comment_count: commentCount || 0,
          };
        })
      );

      return pinsWithCounts;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PINS_PER_PAGE ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  const pins = data?.pages.flat() || [];

  useEffect(() => {
    const channel = supabase
      .channel("pins-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pins",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const lastPinElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (isFetchingNextPage) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        {
          threshold: 0.1,
          rootMargin: "200px",
        }
      );

      if (node) {
        observerRef.current.observe(node);
      }
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  return {
    pins,
    isLoading,
    isFetchingNextPage,
    refetch,
    lastPinElementRef,
  };
};
