<script setup lang="ts">
defineProps<{
  label: string;
  name: string;
  error?: string;
  type?: "text" | "textarea" | "number";
  disabled?: boolean;
}>();
</script>

<template>
  <fieldset class="fieldset">
    <legend class="fieldset-legend">
      {{ label }}
    </legend>
    <Field
      :as="type === 'textarea' ? 'textarea' : 'input'"
      :name="name"
      :type="type"
      :disabled="disabled"
      class="w-full"
      :class="{
        'input-error': error,
        'input': !type || type === 'text' || type === 'number',
        'textarea': type === 'textarea',
      }"
    />
    <p v-if="error" class="label text-error">
      {{ error }}
    </p>
  </fieldset>
</template>
