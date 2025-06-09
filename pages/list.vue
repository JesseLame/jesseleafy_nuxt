<script setup>
import { ref, watch, onMounted } from 'vue'

useSeoMeta({
    title: "Grocery List - Jesse's Leafy Feasts",
    description: 'A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love.',
})

const groceries = ref([
    { name: 'Romaine lettuce', checked: false },
    { name: 'Cherry tomatoes', checked: false },
    { name: 'Mozzarella cheese', checked: false },
    { name: 'Balsamic vinegar', checked: false },
    { name: 'Olive oil', checked: false },
])

const newItem = ref('')

const loadGroceries = () => {
    const storedGroceries = localStorage.getItem('groceries')
    if (storedGroceries) {
        groceries.value = JSON.parse(storedGroceries)
    }
}

const saveGroceries = () => {
    localStorage.setItem('groceries', JSON.stringify(groceries.value))
}

const addItem = () => {
    const trimmed = newItem.value.trim()
    if (trimmed) {
        groceries.value.push({ name: trimmed, checked: false })
        newItem.value = ''
        saveGroceries()
    }
}

const removeItem = (index) => {
    groceries.value.splice(index, 1)
    saveGroceries()
}

onMounted(() => {
    loadGroceries()
})

watch(groceries, saveGroceries, { deep: true })
</script>


<template>
    <div class="min-h-screen flex items-start justify-center p-6 pt-24">
        <div class="w-full sm:max-w-3xl bg-white/70 backdrop-blur-sm rounded-xl shadow-lg text-center p-10">

            <!-- Add item input -->
            <div class="flex items-center mb-6">
                <input v-model="newItem" @keydown.enter.prevent="addItem" type="text" placeholder="Add a new item"
                    class="flex-1 p-2 border rounded-l-lg border-gray-300 focus:outline-none" />
                <button @click="addItem" class="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700">
                    Add
                </button>
            </div>

            <!-- Grocery list -->
            <ul class="text-left">
                <li v-for="(item, index) in groceries" :key="index"
                    class="text-lg text-gray-700 mb-2 flex items-center justify-between">
                    <div class="flex items-center">
                        <input type="checkbox" v-model="item.checked" :id="`item-${index}`"
                            class="mr-2 h-4 w-4 text-green-600 focus:ring-green-500" />
                        <label :for="`item-${index}`" :class="{ 'line-through text-gray-400': item.checked }">
                            {{ item.name }}
                        </label>
                    </div>
                    <button @click="removeItem(index)" class="ml-4 text-red-500 hover:text-red-700 text-sm">
                        Delete
                    </button>
                </li>
            </ul>

        </div>
    </div>
</template>


