<script>
  import { Body, Button, Heading, Layout, notifications } from "@budibase/bbui"
  import { goto, params } from "@roxi/routify"
  import PasswordRepeatInput from "components/common/users/PasswordRepeatInput.svelte"
  import { auth } from "stores/portal"
  import Logo from "assets/bb-space-black.svg"

  const resetCode = $params["?code"]
  let password, error

  $: forceResetPassword = $auth?.user?.forceResetPassword

  async function reset() {
    try {
      if (forceResetPassword) {
        await auth.updateSelf({
          password,
          forceResetPassword: false,
        })
        $goto("../portal/")
      } else {
        await auth.resetPassword(password, resetCode)
        notifications.success("Password reset successfully")
        // send them to login if reset successful
        $goto("./login")
      }
    } catch (err) {
      notifications.error("Unable to reset password")
    }
  }
</script>

<div class="login">
  <div class="main">
    <Layout>
      <Layout noPadding justifyItems="center">
        <img src={Logo} alt="Organisation logo" />
      </Layout>
      <Layout gap="XS" noPadding>
        <Heading textAlign="center">Reset your password</Heading>
        <Body size="S" textAlign="center">
          Please enter the new password you'd like to use.
        </Body>
        <PasswordRepeatInput bind:password bind:error />
      </Layout>
      <Button
        cta
        on:click={reset}
        disabled={error || (forceResetPassword ? false : !resetCode)}
      >
        Reset your password
      </Button>
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
    width: 260px;
  }

  img {
    width: 48px;
  }
</style>
