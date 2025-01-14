import { ReactNode } from 'react';
import { Icon } from '../../../Components/Icon';
import { useSearchInput } from '../../../hooks/useSearchInput';

export function HolderCount({
  count,
  subText,
  image,
  loading,
  name,
  tokenName
}: {
  count: string | number;
  subText: string;
  loading: boolean;
  name: string;
  tokenName: string;
  image?: ReactNode;
}) {
  const setInputs = useSearchInput()[1];

  return (
    <div
      className="px-3 py-5 flex items-center rounded-18 bg-glass cursor-pointer border border-solid border-transparent hover:border-stroke-color-light"
      data-loader-type="block"
      data-loader-height="auto"
      onClick={() => {
        setInputs(
          {
            activeView: name,
            activeViewToken: tokenName,
            activeViewCount: !count || count === '--' ? '0' : '' + count,
            tokenFilters: [name]
          },
          {
            updateQueryParams: true
          }
        );
      }}
    >
      <div className="rounded-full min-w-[47px] w-[47px] h-[47px] overflow-hidden flex-row-center">
        {image}
      </div>
      <div className="pl-2.5 flex-1 overflow-hidden">
        <div className="text-xl font-bold">
          {loading ? (
            <div className="h-6 flex items-center">
              <Icon name="count-loader" className="h-2.5 w-auto" />
            </div>
          ) : (
            count
          )}
        </div>
        <div className="text-text-secondary text-xs ellipsis">{subText}</div>
      </div>
    </div>
  );
}
