export const useLocationStore = defineStore("useLocationStore", () => {
  const { data, status, refresh } = useFetch("/api/locations", {
    lazy: true,
  });

  const sidebarStore = useSidebarStore();
  const mapStore = useMapStore();

  // effect() can be run on the server
  effect(() => {
    if (data.value) {
      sidebarStore.loading = false;
      sidebarStore.sidebarItems = data.value.map(location => ({
        id: `location-${location.id}`,
        label: location.name,
        icon: "tabler:map-pin-filled",
        href: "#",
      }));

      mapStore.mapPoints = data.value.map(location => ({
        id: location.id,
        label: location.name,
        lat: location.lat,
        long: location.long,
      }));
    }

    sidebarStore.loading = status.value === "pending";
  });

  return {
    locations: data,
    status,
    refresh,
  };
});
