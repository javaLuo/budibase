<script>
  import {
    ActionButton,
    Body,
    Button,
    Divider,
    Heading,
    Input,
    Layout,
    notifications,
  } from "@budibase/bbui"
  import { goto, params } from "@roxi/routify"
  import { auth } from "stores/portal"
  import GoogleButton from "./_components/GoogleButton.svelte"
  import Logo from "assets/bb-space-black.svg"

  let username = ""
  let password = ""

  async function login() {
    try {
      await auth.login({
        username,
        password,
      })
      notifications.success("Logged in successfully")
      if ($auth?.user?.forceResetPassword) {
        $goto("./reset")
      } else {
        if ($params["?returnUrl"]) {
          window.location = decodeURIComponent($params["?returnUrl"])
        } else {
          notifications.success("Logged in successfully")
          $goto("../portal")
        }
      }
    } catch (err) {
      console.error(err)
      notifications.error("Invalid credentials")
    }
  }

  function handleKeydown(evt) {
    if (evt.key === "Enter") login()
  }
</script>

<svelte:window on:keydown={handleKeydown} />
<div class="login">
  <div class="main">
    <Layout>
      <Layout noPadding justifyItems="center">
        <img src={Logo} />
        <Heading>Sign in to Budibase</Heading>
      </Layout>
      <GoogleButton />
      <Divider noGrid />
      <Layout gap="XS" noPadding>
        <Body size="S" textAlign="center">Sign in with email</Body>
        <Input label="Email" bind:value={username} />
        <Input
          label="Password"
          type="password"
          on:change
          bind:value={password}
        />
      </Layout>
      <Layout gap="XS" noPadding>
        <Button cta on:click={login}>Sign in to Budibase</Button>
        <ActionButton quiet on:click={() => $goto("./forgot")}>
          Forgot password?
        </ActionButton>
      </Layout>
    </Layout>
  </div>
</div>

<style>
  .login {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .main {
    width: 300px;
  }

  img {
    width: 48px;
  }
</style>
