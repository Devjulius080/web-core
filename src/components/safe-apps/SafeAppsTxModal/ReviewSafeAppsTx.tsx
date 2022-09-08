import { ReactElement } from 'react'
import { DecodedDataResponse, getDecodedData, Operation } from '@gnosis.pm/safe-react-gateway-sdk'
import { OperationType, SafeTransaction } from '@gnosis.pm/safe-core-sdk-types'
import { Box } from '@mui/material'
import SendFromBlock from '@/components/tx/SendFromBlock'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import { InfoDetails } from '@/components/transactions/InfoDetails'
import EthHashInfo from '@/components/common/EthHashInfo'
import SignOrExecuteForm from '@/components/tx/SignOrExecuteForm'
import useAsync from '@/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'
import { createMultiSendCallOnlyTx } from '@/services/tx/txSender'
import { getInteractionTitle, isNativeTransfer } from '../utils'
import { SafeAppsTxParams } from '.'

type ReviewSafeAppsTxProps = {
  onSubmit: (data: null) => void
  safeAppsTx: SafeAppsTxParams
}

const ReviewSafeAppsTx = ({
  onSubmit,
  safeAppsTx: { txs, requestId, params },
}: ReviewSafeAppsTxProps): ReactElement => {
  const chainId = useChainId()
  const chain = useCurrentChain()
  const { safe } = useSafeInfo()

  const isMultiSend = txs.length > 1
  const canExecute = safe.threshold === 1

  const [safeTx, safeTxError] = useAsync<SafeTransaction>(async () => {
    const tx = await createMultiSendCallOnlyTx(txs)

    if (params?.safeTxGas) {
      // @ts-expect-error safeTxGas readonly
      tx.data.safeTxGas = params.safeTxGas
    }

    return tx
  }, [])

  const [decodedData] = useAsync<DecodedDataResponse | undefined>(async () => {
    if (!safeTx || isNativeTransfer(safeTx.data.data)) return

    return getDecodedData(chainId, safeTx.data.data)
  }, [safeTx])

  return (
    <SignOrExecuteForm
      safeTx={safeTx}
      isExecutable={canExecute}
      onSubmit={onSubmit}
      requestId={requestId}
      error={safeTxError}
    >
      <>
        <SendFromBlock />

        {safeTx && (
          <>
            <InfoDetails title={getInteractionTitle(safeTx.data.value || '', chain)}>
              <EthHashInfo address={safeTx.data.to} shortAddress={false} showCopyButton hasExplorer />
            </InfoDetails>

            {isMultiSend && (
              <Box py={1}>
                <Multisend
                  txData={{
                    dataDecoded: decodedData,
                    to: { value: safeTx.data.to },
                    value: safeTx.data.value,
                    operation: safeTx.data.operation === OperationType.Call ? Operation.CALL : Operation.DELEGATE,
                    trustedDelegateCallTarget: false,
                  }}
                />
              </Box>
            )}
          </>
        )}
      </>
    </SignOrExecuteForm>
  )
}

export default ReviewSafeAppsTx
