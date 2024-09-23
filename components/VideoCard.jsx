import { useState } from "react";
import { ResizeMode, Video } from "expo-av";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { useGlobalContext } from "../context/GlobalProvider";
import { savePost, unSavePost } from "../lib/appwrite";
import { icons } from "../constants";
import { usePathname } from "expo-router";

const VideoCard = ({ title, creator, avatar, thumbnail, video }) => {
  const { user } = useGlobalContext();
  const pathName = usePathname();
  const [play, setPlay] = useState(false);
  const [menu, setMenu] = useState(false);

  const handleSave = async () => {
    try {
      setMenu(false);
      await savePost(video, user);
      Alert.alert("Success", "Video saved successfully.");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleUnSave = async () => {
    try {
      setMenu(false);
      await unSavePost(video, user.accountId);
      Alert.alert("Success", "Video unsaved successfully.");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View className="flex flex-col items-center px-4 mb-14">
      <View className="flex flex-row gap-3 items-start">
        <View className="flex justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary flex justify-center items-center p-0.5">
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>

          <View className="flex justify-center flex-1 ml-3 gap-y-1">
            <Text
              className="font-psemibold text-sm text-white"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className="text-xs text-gray-100 font-pregular"
              numberOfLines={1}
            >
              {creator}
            </Text>
          </View>
        </View>

        <View className="pt-2 relative">
          <TouchableOpacity onPress={() => setMenu(!menu)}>
            <Image
              source={icons.menu}
              className="w-5 h-5"
              resizeMode="contain"
            />
          </TouchableOpacity>
          {menu && (
            <View className="absolute flex flex-col gap-3 items-start top-5 right-5 w-48 bg-white rounded-lg shadow-xl z-10 py-2">
              {/* Bookmark Option */}
              {pathName === "/bookmark" ? (
                <TouchableOpacity
                  className="flex flex-row items-center gap-2 px-3 py-2 rounded-lg w-full"
                  activeOpacity={0.7}
                  onPress={handleUnSave}
                >
                  <Image
                    source={icons.bookmark}
                    className="w-5 h-5"
                    resizeMode="contain"
                  />
                  <Text className="text-sm font-psemibold text-gray-800">
                    Unsave
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="flex flex-row items-center gap-2 px-3 py-2 rounded-lg w-full"
                  activeOpacity={0.7}
                  onPress={handleSave}
                >
                  <Image
                    source={icons.bookmark}
                    className="w-5 h-5"
                    resizeMode="contain"
                  />
                  <Text className="text-sm font-psemibold text-gray-800">
                    Bookmark
                  </Text>
                </TouchableOpacity>
              )}

              {/* Share Option */}
              <TouchableOpacity
                className="flex flex-row items-center gap-2 px-3 py-2 rounded-lg w-full"
                activeOpacity={0.7}
              >
                <Image
                  source={icons.share}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text className="text-sm font-psemibold text-gray-800">
                  Share
                </Text>
              </TouchableOpacity>

              {/* Report Option */}
              <TouchableOpacity
                className="flex flex-row items-center gap-2 px-3 py-2 rounded-lg w-full"
                activeOpacity={0.7}
              >
                <Image
                  source={icons.report}
                  className="w-5 h-5"
                  resizeMode="contain"
                />
                <Text className="text-sm font-psemibold text-gray-800">
                  Report
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {play ? (
        <Video
          source={{ uri: video }}
          className="w-full h-60 rounded-xl mt-3"
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              setPlay(false);
            }
          }}
        />
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPlay(true)}
          className="w-full h-60 rounded-xl mt-3 relative flex justify-center items-center"
        >
          <Image
            source={{ uri: thumbnail }}
            className="w-full h-full rounded-xl mt-3"
            resizeMode="cover"
          />

          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VideoCard;
