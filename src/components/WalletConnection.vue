<template>
  <div>
    <input v-model="walletAddress" placeholder="Enter wallet address" />
    <button @click="fetchNFTs" class="lcars-button">Submit</button>
    <div v-if="nftData && nftData.nfts.length">
      <h3>Select an NFT:</h3>
      <select v-model="selectedNftId">
        <option v-for="nft in nftData.nfts" :key="nft.id" :value="nft.id">
          {{ nft.name }}
        </option>
      </select>
      <div v-if="selectedNft" class="nft-details">
        <h3>Selected NFT Details:</h3>
        <p>ID: {{ selectedNft.id }}</p>
        <p>Name: {{ selectedNft.name }}</p>
        <img :src="selectedNft.image" alt="NFT Image" width="100" />
        <button @click="selectNft" class="lcars-button">Lock In</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      walletAddress: '',
      nftData: null,
      selectedNftId: null,
    };
  },
  computed: {
    selectedNft() {
      return this.nftData?.nfts.find(nft => nft.id === this.selectedNftId);
    }
  },
  methods: {
    async fetchNFTs() {
      if (!this.walletAddress) {
        alert('Please enter a wallet address');
        return;
      }
      try {
        const response = await axios.get(`https://api.pallet.exchange/api/v1/user/${this.walletAddress}?network=mainnet&include_tokens=true&include_bids=true`);
        this.nftData = response.data;
        console.log('NFT data fetched:', this.nftData);
      } catch (error) {
        console.error('Error fetching NFT data:', error);
        alert('Failed to fetch NFT data. Please try again.');
      }
    },
    selectNft() {
      if (this.selectedNft) {
        console.log('Emitting NFT:', this.selectedNft);
        this.$emit('nft-selected', {
          image: this.selectedNft.image,
          name: this.selectedNft.name
        });
      }
    }
  },
};
</script>

<style scoped>
.nft-details {
  margin-top: 20px;
}
</style>
