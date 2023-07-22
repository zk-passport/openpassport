import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html>
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin={'true'}
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@500&display=swap"
                    rel="stylesheet"
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="true"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto:wght@300&family=Work+Sans:wght@500&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <body className="bg-blueGrey">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
