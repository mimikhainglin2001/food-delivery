import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";
import { logout } from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";
import { ProfileFieldProps } from "@/type";
import { router } from "expo-router";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ProfileField = ({ label, value, icon }: ProfileFieldProps) => (
  <View className="profile-field">
    <View className="profile-field__icon">
      <Image source={icon} className="size-1/2" resizeMode="contain" />
    </View>
    <View>
      <Text className="small-bold text-gray-100">{label}</Text>
      <Text className="paragraph-bold text-dark-100">{value}</Text>
    </View>
  </View>
);

const Profile = () => {
  const { user, setUser, setIsAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setIsAuthenticated(false);
      router.replace("/sign-in");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <View className="flex-1 px-5 pt-5">
        <View className="custom-header mb-10">
          <View className="w-5" />
          <Text className="base-semibold text-dark-100">Profile</Text>
          <Image source={images.search} className="size-5" resizeMode="contain" />
        </View>

        <View className="flex-center">
          <View className="profile-avatar">
            <Image
              source={user?.avatar ? { uri: user.avatar } : images.avatar}
              className="size-full rounded-full"
              resizeMode="cover"
            />
            <TouchableOpacity className="profile-edit">
              <Image
                source={images.pencil}
                className="size-1/2"
                resizeMode="contain"
                tintColor="#ffffff"
              />
            </TouchableOpacity>
          </View>
          <Text className="h3-bold text-dark-100 mt-3">{user?.name}</Text>
          <Text className="body-regular text-gray-100">{user?.email}</Text>
        </View>

        <View className="mt-10">
          <ProfileField label="Name" value={user?.name ?? ""} icon={images.person} />
          <ProfileField
            label="Email"
            value={user?.email ?? ""}
            icon={images.envelope}
          />
          <ProfileField
            label="Phone"
            value="+385 123 456 789"
            icon={images.phone}
          />
          <ProfileField
            label="Location"
            value="Zagreb, Croatia"
            icon={images.location}
          />
        </View>

        <CustomButton
          title="Logout"
          onPress={handleLogout}
          leftIcon={
            <Image
              source={images.logout}
              className="size-5 mr-2"
              resizeMode="contain"
              tintColor="#ffffff"
            />
          }
          style="!bg-error mt-10"
        />
      </View>
    </SafeAreaView>
  );
};

export default Profile;
