const fields = `id
blockchain
tokenId
tokenAddress
eventId
poapEvent {
  contentValue {
    image {
      original
      medium
      large
      extraSmall
      small
    }
    video
    audio
  }
  logo: contentValue {
    image {
      small
      medium
    }
  }
  blockchain
  eventName
}
owner {
  identity
  addresses
  socials {
    blockchain
    dappSlug
    profileName
  }
  primaryDomain {
    name
  }
  domains {
    chainId
    dappName
    name
  }
  xmtp {
    isXMTPEnabled
  }
}`;

function getQueryWithFiter(tokenids: string[], index = 0): string {
  const children =
    tokenids.length - 1 === index
      ? fields
      : getQueryWithFiter(tokenids, index + 1);
  return `owner {
        poaps(
          input: {filter: {eventId: {_eq: "${tokenids[index]}"}}}
        ) {
            ${children}
          }
        }`;
}

export function createCommonOwnersPOAPsQuery(tokenIds: string[]) {
  const childern =
    tokenIds.length === 1 ? fields : getQueryWithFiter(tokenIds, 1);
  return `query GetPoapHolders($limit: Int) {
    Poaps(
      input: {filter: {eventId: {_eq: "${tokenIds[0]}"}}, blockchain: ALL, limit: $limit}
    ) {
      Poap {
        ${childern}
      }
    } 
  }`;
}