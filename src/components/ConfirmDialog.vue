<template>
  <ModalDialog :open="open" @close="$emit('cancel')">
    <template #title><h3>{{ title }}</h3></template>
    <p>{{ message }}</p>
    <template #actions>
      <button class="btn" @click="$emit('cancel')">取消</button>
      <button class="btn danger" data-test="confirm" @click="$emit('confirm')">删除</button>
    </template>
  </ModalDialog>
</template>

<script setup lang="ts">
import ModalDialog from './ModalDialog.vue'
defineProps<{ open: boolean; title: string; message: string }>()
defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()
</script>

<style scoped>
.btn { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; }
.btn.danger { background: var(--color-overdue); color: #fff; border: none; }
</style>
