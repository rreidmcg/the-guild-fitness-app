import { apiRequest } from "@/lib/queryClient";
import robCustomAvatar from "@assets/E6AE8982-C943-4154-A8B5-82F592441E5D_1753558358031.jpeg";

export async function setRobCustomAvatar() {
  try {
    await apiRequest("PATCH", "/api/user/update-avatar", {
      customAvatarUrl: robCustomAvatar
    });
    console.log("Rob's avatar updated successfully!");
    return true;
  } catch (error) {
    console.error("Failed to update Rob's avatar:", error);
    return false;
  }
}