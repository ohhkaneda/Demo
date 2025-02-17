import { useLazyQueryWithPagination } from '@airstack/airstack-react';
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ComponentProps
} from 'react';
import { ERC20TokensQuery } from '../../queries';
import { SectionHeader } from './SectionHeader';
import { TokenType } from './types';
import classNames from 'classnames';
import { useSearchInput } from '../../hooks/useSearchInput';
import { createTokenHolderUrl } from '../../utils/createTokenUrl';
import { Link } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';
import { formatNumber } from '../../utils/formatNumber';
import './erc20.styles.css';

type LogoProps = Omit<ComponentProps<'img'>, 'src'> & {
  logo: string;
  symbol: string;
};

function Logo({ logo, symbol, ...props }: LogoProps) {
  const [error, setError] = useState(false);
  if (error || !logo) {
    if (symbol) {
      const text = symbol.substring(0, 3);
      return (
        <div className="item flex justify-center items-center h-full w-full font-medium text-xs ellipsis">
          {text.toUpperCase()}
          {symbol.length > 3 ? '..' : ''}
        </div>
      );
    }
    return <img src="images/placeholder.svg" {...props} />;
  }
  return <img src={logo} onError={() => setError(true)} {...props} />;
}

function Token({
  amount,
  symbol,
  type,
  logo
}: {
  type: string;
  symbol: string;
  amount: number;
  logo: string;
}) {
  return (
    <div className="flex mb-5 hover:bg-glass px-3 py-1.5 rounded-18 overflow-hidden">
      <div
        className="h-10 w-10 rounded-full overflow-hidden border-solid-stroke flex-col-center"
        data-loader-type="hidden"
      >
        <Logo logo={logo} symbol={symbol} className="w-full min-w-full" />
      </div>
      <div className="flex flex-1 items-center min-w-0 text-sm pl-2.5">
        <span>{formatNumber(amount)}</span>
        <span className="mx-1.5 ellipsis">{symbol}</span>
        <span className="text-xs text-text-secondary ellipsis min-w-[30%] lowercase">
          {type}
        </span>
      </div>
    </div>
  );
}

const loaderData = Array(3).fill({ poapEvent: {} });

function Loader() {
  return (
    <>
      {loaderData.map((_, index) => (
        <div className="skeleton-loader [&>div>div]:mb-0 mb-5" key={index}>
          <div data-loader-type="block" data-loader-bg="glass">
            <Token key={''} amount={0} symbol={''} type={''} logo="" />
          </div>
        </div>
      ))}
    </>
  );
}

export function ERC20Tokens() {
  const [tokens, setTokens] = useState<{
    ethereum: TokenType[];
    polygon: TokenType[];
  }>({
    ethereum: [],
    polygon: []
  });

  const [fetch, { data: erc20Data, loading, pagination }] =
    useLazyQueryWithPagination(ERC20TokensQuery, {}, { cache: false });
  const [{ address: owner, tokenType, blockchainType, sortOrder }] =
    useSearchInput();

  let data = erc20Data;

  useEffect(() => {
    if (owner) {
      setTokens({
        ethereum: [],
        polygon: []
      });

      // remove data to make sure on next render, the data is not used in the useEffect below
      // eslint-disable-next-line react-hooks/exhaustive-deps
      data = null;

      fetch({
        owner,
        limit: 10
      });
    }
    /*
      Even though ERC20 tokens are not dependant on tokenType, we added tokenType to the dependency array to force a refetch when tokenType changes.
      Without this, the tokens list would be unable to fetch additional pages since the window scroll height would be too great (too many ERC20 items).
      InfiniteScroll depends on the window scroll height, if the height is too high, user will have to scroll to the bottom to initiate a pagination call.
    */
  }, [fetch, owner, tokenType, blockchainType, sortOrder]);

  useEffect(() => {
    if (data) {
      setTokens(existingTokens => ({
        ethereum: [
          ...existingTokens.ethereum,
          ...(data?.ethereum?.TokenBalance || [])
        ],
        polygon: [
          ...existingTokens.polygon,
          ...(data?.polygon?.TokenBalance || [])
        ]
      }));
    }
  }, [data]);

  const { hasNextPage, getNextPage } = pagination;

  const handleNext = useCallback(() => {
    if (!loading && hasNextPage) {
      getNextPage();
    }
  }, [getNextPage, hasNextPage, loading]);

  const items = useMemo((): TokenType[] => {
    return [...tokens.ethereum, ...tokens.polygon];
  }, [tokens.ethereum, tokens.polygon]);

  return (
    <div className="mt-11">
      <div className="hidden sm:block">
        <SectionHeader iconName="erc20" heading="ERC20 tokens" />
      </div>
      <div
        className={classNames(
          'mt-3.5 bg-glass py-3 px-2 rounded-18 border-solid-stroke random-color-list',
          {
            'skeleton-loader min-h-[200px]': items.length === 0 && loading
          }
        )}
        data-loader-type="block"
        data-loader-height="auto"
      >
        {items.length === 0 && !loading && (
          <div className="flex flex-1 justify-center text-xs">
            No data found!
          </div>
        )}

        <InfiniteScroll
          next={handleNext}
          dataLength={items.length}
          hasMore={hasNextPage}
          loader={<Loader />}
        >
          {items.map((token, index) => (
            <Link
              data-address={token?.tokenAddress}
              to={createTokenHolderUrl({
                address: token?.tokenAddress,
                type: 'ERC20',
                blockchain: token.blockchain,
                label: token?.token?.name
              })}
              className="random-color-item"
            >
              <Token
                key={index}
                amount={token?.formattedAmount}
                symbol={token?.token?.symbol}
                type={token?.token?.name}
                logo={
                  token?.token?.logo?.small ||
                  token?.token?.projectDetails?.imageUrl
                }
              />
            </Link>
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
}
