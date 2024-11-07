<template>
  <div class="wallet-connection">
    <div class="input-group">
      <input 
        v-model="walletAddress" 
        placeholder="Enter wallet address" 
        class="lcars-input"
      />
      <button @click="fetchNFTs" class="lcars-button primary">
        SUBMIT
      </button>
    </div>

    <div v-if="nftData" class="nft-selection-group">
      <select 
        v-model="selectedNftId" 
        class="lcars-select"
        :disabled="!nftData.nfts.length"
      >
        <option v-if="!nftData.nfts.length" value="" disabled>No NFT Found</option>
        <option 
          v-for="nft in nftData.nfts" 
          :key="nft.id" 
          :value="nft.id"
        >
          {{ nft.name }}
        </option>
      </select>

      <div v-if="selectedNft" class="selected-nft">
        <img 
          :src="selectedNft.image" 
          alt="NFT Image" 
          class="nft-image" 
        />
        <button 
          @click="selectNft" 
          class="lcars-button secondary"
        >
          LOCK IN
        </button>
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
        
        // Auto-select first NFT if available
        if (this.nftData.nfts && this.nftData.nfts.length > 0) {
          this.selectedNftId = this.nftData.nfts[0].id;
          // Automatically emit the first NFT
          this.selectNft();
        }
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
.wallet-connection {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 15px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 15px;
}

.input-group, .nft-selection-group {
  display: flex;
  gap: 15px;
  align-items: center;
}

.lcars-input {
  padding: 10px 15px;
  border: 2px solid #FF9900;
  border-radius: 10px;
  background-color: #000;
  color: white;
  font-size: 1em;
  min-width: 300px;
}

.lcars-select {
  padding: 10px 15px;
  border: 2px solid #9999CC;
  border-radius: 10px;
  background-color: #000;
  color: white;
  font-size: 1em;
  min-width: 200px;
}

.selected-nft {
  display: flex;
  align-items: center;
  gap: 15px;
}

.nft-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid #FF9900;
}

.lcars-button {
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1em;
  text-transform: uppercase;
  transition: opacity 0.2s;
}

.lcars-button.primary {
  background-color: #FF9900;
  color: black;
}

.lcars-button.secondary {
  background-color: #9999CC;
  color: black;
}

.lcars-button:hover:not(:disabled) {
  opacity: 0.9;
}

.lcars-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.placeholder-option {
  color: rgba(255, 255, 255, 0.5);
}

select option:not(.placeholder-option) {
  color: white;
  background-color: #000;
}
</style>
