<script>
  import {
    notifications,
    Input,
    Button,
    Layout,
    Body,
    Heading,
  } from "@budibase/bbui"
  import { organisation, auth } from "stores/portal"
  import Logo from "assets/bb-space-black.svg"

  let email = ""

  async function forgot() {
    try {
      await auth.forgotPassword(email)
      notifications.success("Email sent - please check your inbox")
    } catch (err) {
      notifications.error("Unable to send reset password link")
    }
  }
</script>

<div class="login">
  <div class="main">
    <Layout>
      <Layout noPadding justifyItems="center">
        <img src={$organisation.logoUrl || Logo} />
      </Layout>
      <Layout gap="XS" noPadding>
        <Heading textAlign="center">Forgotten your password?</Heading>
        <Body size="S" textAlign="center">
          No problem! Just enter your account's email address and we'll send you
          a link to reset it.
        </Body>
        <Input label="Email" bind:value={email} />
      </Layout>
      <Button cta on:click={forgot} disabled={!email}>
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
    width: 300px;
  }

  img {
    width: 48px;
  }
</style>
