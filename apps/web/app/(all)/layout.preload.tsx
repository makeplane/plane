// TODO: Check if we need this
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata#link-relpreload
// export const usePreloadResources = () => {
//   useEffect(() => {
//     const preloadItem = (url: string) => {
//       ReactDOM.preload(url, { as: "fetch", crossOrigin: "use-credentials" });
//     };

//     const urls = [
//       `${process.env.VITE_API_BASE_URL}/api/instances/`,
//       `${process.env.VITE_API_BASE_URL}/api/users/me/`,
//       `${process.env.VITE_API_BASE_URL}/api/users/me/profile/`,
//       `${process.env.VITE_API_BASE_URL}/api/users/me/settings/`,
//       `${process.env.VITE_API_BASE_URL}/api/users/me/workspaces/?v=${Date.now()}`,
//     ];

//     urls.forEach((url) => preloadItem(url));
//   }, []);
// };

export function PreloadResources() {
  return (
    // usePreloadResources();
    null
  );
}
