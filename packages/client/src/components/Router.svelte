<script>
  import { getContext } from "svelte"
  import Router from "svelte-spa-router"
  import { routeStore } from "../store"
  import Screen from "./Screen.svelte"
  import { onMount } from "svelte"

  const { styleable } = getContext("sdk")
  const component = getContext("component")

  // Only wrap this as an array to take advantage of svelte keying,
  // to ensure the svelte-spa-router is fully remounted when route config
  // changes
  $: config = {
    routes: getRouterConfig($routeStore.routes),
    id: $routeStore.routeSessionId,
  }

  const getRouterConfig = routes => {
    let config = {}
    routes.forEach(route => {
      config[route.path] = Screen
    })

    // Add catch-all route so that we serve the Screen component always
    config["*"] = Screen
    return config
  }

  const onRouteLoading = ({ detail }) => {
    routeStore.actions.setActiveRoute(detail.route)
  }
</script>

{#key config.id}
  <div use:styleable={$component.styles}>
    <Router on:routeLoading={onRouteLoading} routes={config.routes} />
  </div>
{/key}

<style>
  div {
    position: relative;
  }
</style>
