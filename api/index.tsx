import { serveStatic } from 'frog/serve-static'; 
import { Button, Frog, TextInput } from 'frog';
import { devtools } from 'frog/dev';
import { ethers } from 'ethers';
import { handle } from 'frog/vercel'

export const app = new Frog({
  basePath: '/api',
  title: 'OP 5 Airdrop Eligibility Checker',
});

app.use('/*', serveStatic({ root: './public' }));

// Function to fetch and parse the eligible addresses CSV
async function fetchEligibleAddresses() {
  const response = await fetch("https://raw.githubusercontent.com/ethereum-optimism/op-analytics/refs/heads/main/reference_data/address_lists/op_airdrop_5_simple_list.csv");
  const csvData = await response.text();
  const addresses = new Set();

  // Split the CSV data into lines and extract addresses
  csvData.split("\n").forEach(line => {
    const [address] = line.trim().split(','); // Take the first column (address)
    if (address) addresses.add(address.toLowerCase()); // Add address to the Set
  });

  return addresses;
}

// Function to check eligibility based on address
async function checkEligibility(userAddress: string) {
  const eligibleAddresses = await fetchEligibleAddresses();
  const normalizedAddress = ethers.getAddress(userAddress).toLowerCase();
  return eligibleAddresses.has(normalizedAddress);
}

// Main Frame
app.frame('/', async (c) => {
  const { inputText, status } = c;

  // If inputText is present and status is 'response', check eligibility
  if (status === 'response' && inputText) {
    const isEligible = await checkEligibility(inputText);
    
    // Redirect to eligible or not eligible frame
    return c.res({
      image: isEligible 
        ? 'https://i.imgur.com/5iRDaNM.jpeg' 
        : 'https://i.imgur.com/vYnfJed.jpeg',
      intents: isEligible 
        ? [
            <Button.Link href="https://app.optimism.io/airdrops/5">Claim Airdrop</Button.Link>,
            <Button.Reset>Reset</Button.Reset>,
          ] 
        : [
            <Button.Reset>Reset</Button.Reset>,
          ],
    });
  }

  // Default state: Show the initial image and input field
  return c.res({
    image: 'https://i.imgur.com/HIP3C72.jpeg', // Default image
    intents: [
      <TextInput placeholder="Wallet Address" />,
      <Button>Check Eligibility</Button>,
    ],
  });
});

devtools(app, { serveStatic });

  export const GET = handle(app)
  export const POST = handle(app)