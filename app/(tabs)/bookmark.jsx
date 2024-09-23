import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useAppwrite from "../../lib/useAppwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { getSavedPosts } from "../../lib/appwrite";
import EmptyState from "../../components/EmptyState";
import SearchInput from "../../components/SearchInput";
import VideoCard from "../../components/VideoCard";

const Search = () => {
  const { query } = useLocalSearchParams();
  const { user } = useGlobalContext();
  const { data: posts, refetch } = useAppwrite(() => getSavedPosts(user.accountId));
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard
            title={item.title}
            thumbnail={item.thumbnail}
            video={item.video}
            creator={item.creator.username}
            avatar={item.creator.avatar}
          />
        )}
        ListHeaderComponent={() => (
          <>
            <View className="flex my-6 px-4">
              <Text className="font-pmedium text-gray-100 text-sm">
                Saved Videos
              </Text>

              <View className="mt-6 mb-8">
                <SearchInput initialQuery={query} refetch={refetch} />
              </View>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="No videos found for this search query"
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Search;
