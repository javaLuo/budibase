<script>
  import { writable } from "svelte/store"
  import { setContext, onMount } from "svelte"
  import Component from "./Component.svelte"
  import NotificationDisplay from "./NotificationDisplay.svelte"
  import Provider from "./Provider.svelte"
  import SDK from "../sdk"
  import {
    createContextStore,
    initialise,
    screenStore,
    authStore,
    routeStore,
    builderStore,
  } from "../store"
  import { TableNames, ActionTypes } from "../constants"

  // Provide contexts
  setContext("sdk", SDK)
  setContext("component", writable({}))
  setContext("context", createContextStore())

  let dataLoaded = false

  // Load app config
  onMount(async () => {
    await initialise()
    await authStore.actions.fetchUser()
    dataLoaded = true
  })

  // Register this as a refreshable datasource so that user changes cause
  // the user object to be refreshed
  $: actions = [
    {
      type: ActionTypes.RefreshDatasource,
      callback: () => authStore.actions.fetchUser(),
      metadata: { dataSource: { type: "table", tableId: TableNames.USERS } },
    },
  ]

  // Redirect to home layout if no matching route
  $: {
    if (dataLoaded && $routeStore.routerLoaded && !$routeStore.activeRoute) {
      if ($authStore) {
        routeStore.actions.navigate("/")
      } else {
        const returnUrl = `${window.location.pathname}${window.location.hash}`
        const encodedUrl = encodeURIComponent(returnUrl)
        window.location = `/builder/auth/login?returnUrl=${encodedUrl}`
      }
    }
  }
</script>

{#if dataLoaded && $screenStore.activeLayout}
  <div lang="en" dir="ltr" class="spectrum spectrum--medium spectrum--light">
    <Provider key="user" data={$authStore} {actions}>
      <Component definition={$screenStore.activeLayout.props} />
      <NotificationDisplay />
    </Provider>
  </div>
{/if}

<style>
  div {
    background: transparent;
    height: 100%;
    position: relative;
  }
</style>
