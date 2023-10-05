import levenshtein from "fast-levenshtein";

interface Protocol {
  name: string;
  url: string;
  logo: string;
  category?: string;
  tvl?: number;
}

interface Token {
  id: string;
  name: string;
  platforms: {
    [chain: string]: string
  }
  symbol: string;
  mcap: number;
}

interface NFT {
  collectionId: string;
  name: string;
  mcap: number;
  image: string;
}

interface Other {
    name: string;
    url: string;
    logo: string;
}

function calculateRankingScore(searchText:string, name:string, usdValue:number, altKey?:string){
    if(name.toLowerCase().startsWith(searchText)){
        return usdValue
    }
    return 0
}

export function calculateSearchOptions(text:string, storedDB: {tokens:Token[], nfts:NFT[], protocols:Protocol[], other: Other[]}){
    const normalizedText = text.toLowerCase()
    const googleSearchOption = {
        text: "Search google",
        url: `https://www.google.com/search?q=${text}`,
        type: "google",
        score: 1
    }
    if(/0x[0-f]{64}/.test(text)){
        return [
            {
                text: "Open tx in etherscan",
                url: `https://blockscan.com/tx/${text}`,
                type: "etherscan"
            },
            googleSearchOption
        ]
    }
    if(/0x[0-9A-Fa-f]{40}/.test(text)){
        return [
            {
                text: "Open address in blockscan",
                url: `https://blockscan.com/address/${text}`,
                type: "etherscan"
            },
            {
                text: "Open address in debank",
                url: `https://debank.com/profile/${text}`,
                type: "debank"
            },
            googleSearchOption
        ]
    }
    if(/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(text)){
        return [
            {
                text: "Open bitcoin address in explorer",
                url: `https://www.blockchain.com/explorer/addresses/btc/${text}`,
                type: "blockchain"
            },
            googleSearchOption
        ]
    }
    if(text.startsWith("$")){
        const ticker = normalizedText.slice(1)
        const matched = storedDB.tokens.filter(p=>p.symbol.startsWith(ticker))
        return [
            ...matched.slice(0,3).map(p=>({
                text: `$${p.symbol.toUpperCase()} on coingecko`,
                url: `https://www.coingecko.com/en/coins/${p.id}`,
                type: "coingecko"
            })),
            googleSearchOption
        ]
    }
    let list = []
    if (text.length > 3) {
        list = list.concat(
            storedDB.nfts.map(p => ({
                text: `Check price of ${p.name} on defillama`,
                url: `https://defillama.com/nfts/collection/${p.collectionId}`,
                type: "nft",
                score: calculateRankingScore(normalizedText, p.name, p.mcap)
            })),
            storedDB.protocols.map(p => ({
                text: `Open ${p.name}`,
                url: p.url,
                type: "protocol",
                score: calculateRankingScore(normalizedText, p.name, p.tvl)
            })),
            storedDB.other.map(p => ({
                text: `Open ${p.name}`,
                url: p.url,
                type: "other",
                score: calculateRankingScore(normalizedText, p.name, Number.MAX_VALUE)
            })),
            storedDB.tokens.map(p => ({
                text: `Check ${p.name} on coingecko`,
                url: `https://www.coingecko.com/en/coins/${p.id}`,
                type: "coingecko",
                score: calculateRankingScore(normalizedText, p.name, p.mcap, p.symbol)
            }))
        )
    }
    return list.sort((a,b)=>b.score - a.score).slice(0,4).concat([
        googleSearchOption
    ])
    // Swap X for Y
    // Borrow X
}