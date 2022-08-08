<!-- This example requires Tailwind CSS v2.0+ -->
<template>
  <Disclosure as="nav" class="bg-gray-800" v-slot="{ open }">
    <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
      <div class="relative flex items-center justify-between h-16">
        <div class="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
          <div class="hidden sm:block sm:ml-6">
            <div class="flex space-x-4">
              <NavLink :to="{name: 'Home'}">Home</NavLink>
              <NavLink :to="{name: 'Main'}">Main</NavLink>
              <NavLink v-if="!user" :to="{ name: 'Login'}">Login</NavLink>
              <NavLink v-if="user" :to="{ name: 'Data'}">Data</NavLink>
            </div>
          </div>
        </div>
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
          <!-- Profile dropdown -->
          <Menu as="div" class="ml-3 relative z-10" v-show="user">
            <div>
              <MenuButton class="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                <span class="sr-only">Open user menu</span>
                <UserCircleIcon id="user-icon" style="width: 100% !important" class="w-8 h-8 fill-white rounded-full"/>
                <!-- <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" /> -->
              </MenuButton>
            </div>
            <transition enter-active-class="transition ease-out duration-100 z-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
              
              <MenuItems class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div class="px-3 py-1 ">
                  {{ firstName }} {{ lastName }}
                </div>
                <MenuItem v-slot="{ active }">
                  <a href="/profile" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700']">Your Profile</a>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <a href="/settings" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700']">Settings</a>
                </MenuItem>
                <MenuItem v-slot="{ active }" @click="signOut">
                  <a href="#" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700']">Sign out</a>
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
    </div>

    <DisclosurePanel class="sm:hidden">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <DisclosureButton v-for="item in navigation" :key="item.name" as="a" :href="item.href" :class="[item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white', 'block px-3 py-2 rounded-md text-base font-medium']" :aria-current="item.current ? 'page' : undefined">{{ item.name }}</DisclosureButton>
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>

<script>
import AppLink from '@/components/AppLink.vue'
import NavLink from '@/components/NavLink.vue';
import ProfileLink from '@/components/ProfileLink.vue'

import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { BellIcon, MenuIcon, XIcon } from '@heroicons/vue/outline'
import { UserCircleIcon} from '@heroicons/vue/solid'

import { getAuth } from "firebase/auth";


export default {
  name: "NavBar",
  components: {
    AppLink,
    NavLink,
    ProfileLink,

    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
    BellIcon,
    MenuIcon,
    XIcon,
    UserCircleIcon,
},
  data() {
    return {
      test: null, 
      dropdown: false,

    }
  },
  computed: {
    user() {
      // console.log('user')
      if (this.$store.state.user) {
        console.log('Navbar > User exists:')
        console.log(this.$store.state.user)
        return true
      } 
      console.log('Navbar > User does not exist')
      return false
    },
    firstName() {
      return this.$store.state.profileFirstName
    },
    lastName() {
      return this.$store.state.profileLastName
    }
  },
  methods: {
    signOut() {
      console.log('signOut')
      const auth = getAuth()
      auth.signOut();
      // May need to re-direct to Home if on page requiring auth 
      this.$router.push({ name: 'Home' })
      // window.location.reload();

    }
  }
}

</script>