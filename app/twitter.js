import { useEffect, useState } from 'react';
import { getTwitterByAddress } from './utils';

export default function Twitter(props) {
  const [twitter, setTwitter] = useState('');
  const [imgUrl, setImgUrl] = useState('');

  useEffect(()=>{
    if (!props.address) {
      return;
    }
    getTwitterByAddress(props.address).then((ret)=>{
      setTwitter(ret.twitterUsername);
      setImgUrl(ret.twitterPfpUrl);
    }).catch((err)=>{
      console.error(err);
    });
  }, [props.address]);
  
  return (
    <div className='inline-block'>
      &nbsp;
    {
      twitter && <a
        href={`https://twitter.com/${twitter}`}
        target="_blank"
        rel="noopener noreferrer"
        className='inline-block text-blue-500 bg-white cursor-pointer text-xs border p-1 border-blue-500 rounded-lg hover:bg-blue-500 hover:text-white'
      >
        <div className='inline-block flex items-center'>
          <img src={imgUrl} className='w-4 h-4 rounded-full' alt='Profile' />
          {
            !props.noName && <span className='ml-0'>@{twitter}</span>
          }
        </div>
      </a>
    }
    </div>
  )
}
