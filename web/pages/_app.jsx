/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2023-12-24 05:11:34
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-01-21 23:42:41
 * @FilePath: /TheLastOneGame/pages/_app.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import "../styles/globals.css"
import Nav from '@/components/Nav';
import { Web3Provider } from "providers/Web3"
import { Toaster } from 'react-hot-toast'
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <Web3Provider>

        <Nav />
        <Component {...pageProps} />
        <Toaster position="top-center"></Toaster>
      </Web3Provider></>

  )
}

export default MyApp
