import { MentionsQuery } from '../../queries';
import { ADDRESS_OPTION_ID, POAP_OPTION_ID } from './constants';

export enum MentionType {
  DAO_TOKEN = 'DAO_TOKEN',
  NFT_COLLECTION = 'NFT_COLLECTION',
  POAP = 'POAP',
  TOKEN = 'TOKEN'
}

export enum Blockchain {
  ethereum = 'ethereum',
  polygon = 'polygon'
}

export interface SearchAIMentions_SearchAIMentions {
  __typename: 'SearchAIMentionsResult';
  type: MentionType | null;
  name: string | null;
  address: string | null;
  eventId: string | null;
  blockchain: Blockchain | null;
  thumbnailURL: string | null;
}

export const ID_REGEX = /#⎱.+?⎱\((.+?)\)\s*/g;
export const NAME_REGEX = /#⎱(.+?)⎱\(.+?\)/g;
export const REGEX_LAST_WORD_STARTS_WITH_AT = /\s@[^\s-]*$/g;
const REGEX_FISRT_WORD = /([^\s-]*)/;

const tokenValuePrefixMap: Record<MentionType, string> = {
  [MentionType.NFT_COLLECTION]: 'NFT collection',
  [MentionType.DAO_TOKEN]: 'token contract address',
  [MentionType.TOKEN]: 'token contract address',
  [MentionType.POAP]: 'POAP event ID'
};

export function getNameFromMarkup(markup: string) {
  //matches names with [ and ] brackets, also keeps one ] in the end
  const NEW_NAME_REGEX = /#⎱([^⎱]+)⎱\((?:[^)]+?)\)/;
  const match = markup.match(NEW_NAME_REGEX);
  if (!match || match[1]) return '';
  // remove the end ] from the string
  return match[1].substring(2, match[1].length - 1);
}

function getNode(parent: HTMLElement) {
  let node = parent.querySelector('#mention-highlight');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'mention-highlight';
  parent.insertBefore(node, parent.firstChild);
  return node;
}

export function highlightMentionText(root: HTMLElement, matched = false) {
  const children = root?.childNodes;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateOnMatch(node: any, regex: RegExp) {
    const _node = node.children?.length > 0 ? node.children[0] : node;
    if (node.nodeType !== Node.TEXT_NODE) {
      node.innerHTML = _node.innerHTML.replace(regex, (match: string) => {
        return `<span class="match-at">${match}</span>`;
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children.forEach((node: any) => {
    const mentionStartMatch = REGEX_LAST_WORD_STARTS_WITH_AT.exec(
      node.innerText
    );

    if (node?.children && node.children.length > 1) {
      highlightMentionText(node, matched);
      return;
    }

    // there is chance that the whole mention word is not in the single node
    // this can happen when the cursor is in the middle of the mention word
    if (matched && node) {
      updateOnMatch(node, REGEX_FISRT_WORD);
      matched = false;
      return;
    }

    if (mentionStartMatch) {
      updateOnMatch(node, REGEX_LAST_WORD_STARTS_WITH_AT);
      matched = true;
    }
  });
}

export function highlightMention(el: HTMLTextAreaElement | null) {
  if (!el) return;
  const root = getNode(el.parentElement as HTMLElement) as HTMLElement;
  const targetNode = root.nextSibling as HTMLElement;
  const config = { childList: true, subtree: true, characterData: true };

  const callback = () => {
    root.innerHTML = targetNode.innerHTML;
    highlightMentionText(root);
  };
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
  callback(); // handle the initial value

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleScroll({ target }: any) {
    root.scrollTop = target.scrollTop;
    root.scrollLeft = target.scrollLeft;
  }

  el.addEventListener('scroll', handleScroll);

  return () => {
    observer.disconnect();
    if (el) {
      el.removeEventListener('scroll', handleScroll);
    }
  };
}

export function capitalizeFirstLetter(str: string) {
  const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
  return capitalized;
}
// id format: <address> <token type> <blockchain>
export function generateId(mention: SearchAIMentions_SearchAIMentions) {
  return `${mention.address} ${mention.type} ${mention.blockchain} ${mention.eventId}`;
}

export function getUsableValues(value: string) {
  if (!value) return { prompt: '', displayValue: '' };
  // customId is a string generated by generateId function
  function replacer(_: unknown, customId: string) {
    const [address, token, blockchain, _eventId, customInputType] =
      customId.split(' ');
    const eventId = _eventId === 'null' ? null : _eventId;
    // if no token and blockchain, it's a user entered address so use it as is
    if (customInputType === ADDRESS_OPTION_ID) {
      return `${address} `;
    }

    if (customInputType === POAP_OPTION_ID || token === MentionType.POAP) {
      return `${tokenValuePrefixMap[MentionType.POAP]} ${eventId || address} `;
    }

    return `${
      tokenValuePrefixMap[token as MentionType] || ''
    } ${address} on ${blockchain} `;
  }
  const prompt = value.replace(ID_REGEX, replacer);
  const displayValue = value.replace(NAME_REGEX, '$1 ');
  return {
    prompt,
    displayValue
  };
}
export function isMention(str: string) {
  return Boolean(/#⎱.+?⎱\((.+?)\)\s*/g.exec(str));
}

export function getValuesFromId(id: string) {
  const match = /#⎱.+?⎱\((.+?)\)\s*/g.exec(id);
  if (!match) return { address: id };
  const [address, token, blockchain, eventId, customInputId] =
    match[1].split(' ');

  const customInputType =
    token === MentionType.POAP || customInputId === POAP_OPTION_ID
      ? 'POAP'
      : 'ADDRESS';

  return {
    address,
    token,
    blockchain,
    eventId: eventId === 'null' ? null : eventId,
    customInputType
  };
}

export function needHelp(str: string) {
  // match /help or /help <something>
  const regex = /\/(help|.*?\shelp)/g;
  const match = regex.exec(str.trim());
  return Boolean(match);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debouncePromise<CB extends (...args: any[]) => any>(
  callback: CB,
  timeout = 500
): CB {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let timer: any;
  let resolved: ((value: null | Awaited<ReturnType<CB>>) => void) | null = null;
  return ((...args) => {
    clearTimeout(timer);
    if (resolved) {
      resolved(null);
      resolved = null;
    }
    timer = setTimeout(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await callback(...args);
      if (resolved) {
        resolved(response);
      }
    }, timeout);
    return new Promise(r => (resolved = r));
  }) as CB;
}

export async function fetchMentionOptions(
  query: string,
  limit: number
): Promise<[null | object, null | string]> {
  try {
    const res = await fetch('https://bff-prod.airstack.xyz/graphql', {
      method: 'POST',
      body: JSON.stringify({
        operationName: 'SearchAIMentions',
        query: MentionsQuery,
        variables: {
          input: {
            searchTerm: query,
            limit
          }
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      return [null, 'Something went wrong'];
    }

    const { data } = await res.json();

    if (data.errors) {
      return [null, data.errors[0].message];
    }

    return [data, null];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return [null, error?.message || 'Something went wrong'];
  }
}
