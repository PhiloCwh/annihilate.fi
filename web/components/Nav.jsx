/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2023-12-24 05:11:34
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-17 14:16:48
 * @FilePath: /marketPlace/components/Nav.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useEffect, useState } from 'react'
import styles from 'styles/Nav.module.css'
import logo from 'public/logo.png'
import twitter from '@/assets/image/svg/twitter.svg'
import gitbook from '@/assets/image/svg/gitbook.svg'
import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useNetwork } from 'wagmi'
import { useRouter } from 'next/router'
import Link from 'next/link'


const Nav = () => {
    const { address } = useAccount()
    const { chain } = useNetwork()
    const router = useRouter();
    const currentPath = router.pathname;
    // 根据当前路径进行判断或其他逻辑
    const isHome = currentPath === '/';


    useEffect(() => {
        if (chain?.network == "sepolia") {
            // 使用 router.push 进行跳转
            router.push('/');
        }
    }, [chain])

    return (
        <div className={styles.container}>
            <div className={styles.tittle}>
                <Link href='/'>
                    <Image src={logo} alt='image' width={52} height={52} />
                </Link>
                <div className={styles.list}>
                    <Link href='/'>
                        <div className={`${styles.btn} ${isHome ? styles.btnActive : ''}`}>
                            Swap
                        </div>
                    </Link>
                    <Link href='/margin'>
                        <div className={`${styles.btn} ${currentPath === '/margin' ? styles.btnActive : ''}`}>
                            Margin
                        </div>
                    </Link>
                    <Link href='/borrow'>
                        <button className={`${styles.btn} ${currentPath === '/borrow' ? styles.btnActive : ''}`}>
                            Assets Management
                        </button>
                    </Link>
                </div>
            </div>

            <div className={styles.connectBtn}>
                <ConnectButton.Custom>
                    {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        authenticationStatus,
                        mounted,
                    }) => {
                        // Note: If your app doesn't use authentication, you
                        // can remove all 'authenticationStatus' checks
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected =
                            ready &&
                            account &&
                            chain &&
                            (!authenticationStatus ||
                                authenticationStatus === 'authenticated');
                        return (
                            <div
                                {...(!ready && {
                                    'aria-hidden': true,
                                    'style': {
                                        opacity: 0,
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    },
                                })}
                            >
                                {(() => {
                                    if (!connected) {
                                        return (
                                            <button onClick={openConnectModal} type="button" className={styles.connectWalletBtn}>
                                                Connect Wallet
                                            </button>
                                        );
                                    }
                                    if (chain.unsupported) {
                                        return (
                                            <button onClick={openChainModal} type="button" className={`${styles.connectWalletBtn} + ${styles.walletAdressBtn}`}>
                                                Wrong network
                                            </button>
                                        );
                                    }
                                    return (
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={openChainModal}
                                                className={`${styles.connectWalletBtn} + ${styles.walletAdressBtn}`}
                                                type="button"
                                            >
                                                {chain.hasIcon && (
                                                    <div
                                                        style={{
                                                            background: chain.iconBackground,
                                                            width: 16,
                                                            height: 16,
                                                            borderRadius: 999,
                                                            marginRight: 4,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {chain.iconUrl && (
                                                            <img
                                                                alt={chain.name ?? 'Chain icon'}
                                                                src={chain.iconUrl}
                                                                style={{ width: 16, height: 16 }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                {chain.name}
                                            </button>
                                            <button onClick={openAccountModal} type="button" className={`${styles.connectWalletBtn} + ${styles.walletAdressBtn}`}>
                                                {account.displayName}
                                                {account.displayBalance
                                                    ? ` (${account.displayBalance})`
                                                    : ''}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    }}
                </ConnectButton.Custom>
                <div className="flex items-center gap-2 ml-4">
                    <a
                        href="https://twitter.com/XpetFinance"
                        target="_blank"
                        className="flex-col-center text-primary transition-all hover:scale-95"
                    >
                        <Image src={twitter} style={{ width: '28px', height: '28px' }} alt='image' />
                    </a>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <a
                        href="https://xpet-ecosystem-organization.gitbook.io/xpetbond/"
                        target="_blank"
                        className="flex-col-center text-primary transition-all hover:scale-95"
                    >
                        <Image src={gitbook} style={{ width: '28px', height: '28px' }} alt='image' />
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Nav