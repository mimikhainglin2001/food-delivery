import CardButton from "@/components/CardButton";
import Filter from "@/components/Filter";
import MenuCard from "@/components/MenuCard";
import SearchBar from "@/components/SearchBar";
import { debugCategories, getCategories, getMenu } from "@/lib/appwrite";
import useAppwrite from "@/lib/useAppWrite";
import { MenuItem } from "@/type";
import cn from "clsx";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Search = () => {
  const { category, categoryName, query } = useLocalSearchParams<{
    query: string;
    category: string;
    categoryName: string;
  }>();

  const { data, refetch, loading } = useAppwrite({
    fn: getMenu,
    params: { category, categoryName, query, limit: 6 },
  });
  const { data: categories } = useAppwrite({ fn: getCategories });

  useEffect(() => {
    debugCategories(); // TEMP DEBUG - remove later
    refetch({ category, categoryName, query, limit: 6 });
  }, [category, categoryName, query]);

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={data}
        renderItem={({ item, index }) => {
          const isFirstRightColItem = index % 2 === 0;

          return (
            <View
              className={cn(
                "flex-1 max-w-[48%]",
                !isFirstRightColItem ? "mt-10" : "mt-0",
              )}
            >
              <MenuCard item={item as unknown as MenuItem} />
            </View>
          );
        }}
        keyExtractor={(item) => item.$id}
        numColumns={2}
        columnWrapperClassName="gap-7"
        contentContainerClassName="gap-7 px-5 pb-32"
        ListHeaderComponent={() => (
          <View className="my-5 gap-5">
            <View className="flex-between flex-row w-full">
              <View className="flex-start">
                <Text className="small-bold uppercase text-primary">
                  Search
                </Text>
                <View className="flex-start flex-row gap-x-1 mt-0.5">
                  <Text className="paragraph-semibold text-dark-100">
                    Find your favorite food
                  </Text>
                </View>
              </View>

              <CardButton />
            </View>

            <SearchBar />

            <Filter categories={categories} />

            <TouchableOpacity
            // onPress={async () => {
            //   try {
            //     await seed();
            //     Alert.alert(
            //       "Success",
            //       "Database seeded. Reload the app to see the fix.",
            //     );
            //   } catch (e) {
            //     const err = e as {
            //       message?: string;
            //       type?: string;
            //       code?: number;
            //     };
            //     console.error("Seed failed:", e);
            //     Alert.alert(
            //       "Seed failed",
            //       `${err?.code ?? ""} ${err?.message ?? err?.type ?? String(e)}`.trim(),
            //     );
            //   }
            // }}
            // className="bg-gray-100 p-2.5 rounded-lg self-start"
            >
              {/* <Text className="body-medium text-gray-500">
                Re-seed database (temp)
              </Text> */}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => !loading && <Text>No results</Text>}
      />
    </SafeAreaView>
  );
};

export default Search;
