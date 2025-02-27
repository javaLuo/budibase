<script>
  import { Input, TextArea } from "@budibase/bbui"
  import { store, hostingStore } from "builderStore"
  import api from "builderStore/api"
  import { object, string } from "yup"
  import { onMount } from "svelte"
  import { get } from "svelte/store"

  let nameValidation, nameError
  let urlValidation, urlError

  $: checkName($store.name)
  $: checkUrl($store.url)

  async function updateApplication(data) {
    const response = await api.put(`/api/applications/${$store.appId}`, data)
    await response.json()
    store.update(state => {
      state = {
        ...state,
        ...data,
      }
      return state
    })
  }

  async function checkValidation(input, validation) {
    if (!input || !validation) {
      return
    }
    try {
      await object(validation).validate(input, { abortEarly: false })
    } catch (error) {
      if (!error || !error.inner) return ""
      return error.inner.reduce((acc, err) => {
        return acc + err.message
      }, "")
    }
  }

  async function checkName(name) {
    nameError = await checkValidation({ name }, nameValidation)
  }

  async function checkUrl(url) {
    urlError = await checkValidation({ url: url.toLowerCase() }, urlValidation)
  }

  onMount(async () => {
    const nameError = "Your application must have a name.",
      urlError = "Your application must have a URL."
    await hostingStore.actions.fetchDeployedApps()
    const existingAppNames = get(hostingStore).deployedAppNames
    const existingAppUrls = get(hostingStore).deployedAppUrls
    const nameIdx = existingAppNames.indexOf(get(store).name)
    const urlIdx = existingAppUrls.indexOf(get(store).url)
    if (nameIdx !== -1) {
      existingAppNames.splice(nameIdx, 1)
    }
    if (urlIdx !== -1) {
      existingAppUrls.splice(urlIdx, 1)
    }
    nameValidation = {
      name: string().required(nameError).notOneOf(existingAppNames),
    }
    urlValidation = {
      url: string().required(urlError).notOneOf(existingAppUrls),
    }
  })
</script>

<div class="container">
  <Input
    on:change={e => updateApplication({ name: e.detail })}
    value={$store.name}
    error={nameError}
    label="App Name"
  />
  <Input
    on:change={e => updateApplication({ url: e.detail })}
    value={$store.url}
    error={urlError}
    label="App URL"
  />
  <TextArea
    on:change={e => updateApplication({ description: e.detail })}
    value={$store.description}
    label="App Description"
  />
</div>

<style>
  .container {
    display: grid;
    grid-gap: var(--spacing-xl);
  }
</style>
