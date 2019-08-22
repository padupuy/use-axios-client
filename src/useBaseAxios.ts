import { useEffect, useReducer, useRef } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import createReducer, { initialState, RequestState } from './reducer';

let source = axios.CancelToken.source();

interface RequestFunctions {
  cancel: () => void;
}

type Props<Data> = RequestState<Data> & RequestFunctions;

export type BaseAxios<Data> = [() => Promise<void>, Props<Data>];

function useBaseAxios<Data>(url: string): BaseAxios<Data>;
function useBaseAxios<Data>(config: AxiosRequestConfig): BaseAxios<Data>;
function useBaseAxios<Data>(
  url: string,
  config: AxiosRequestConfig
): BaseAxios<Data>;

function useBaseAxios<Data>(
  param1: string | AxiosRequestConfig,
  param2: AxiosRequestConfig = {}
) {
  const [{ data, error, loading }, dispatch] = useReducer(
    createReducer<Data>(),
    initialState
  );

  const isMounted = useRef(true);

  const invokeAxios =
    typeof param1 === 'string'
      ? () =>
          axios(param1, {
            ...param2,
            cancelToken: source.token,
          })
      : () =>
          axios({
            ...param1,
            cancelToken: source.token,
          });

  const getData = async () => {
    dispatch({ type: 'REQUEST_INIT' });
    try {
      const res = (await invokeAxios()) as AxiosResponse<Data>;
      if (isMounted.current) {
        dispatch({ type: 'REQUEST_SUCCESS', payload: res.data });
      }
    } catch (e) {
      if (isMounted.current) {
        dispatch({ type: 'REQUEST_FAILED', payload: e });
      }
    }
  };

  const cancel = () => {
    source.cancel('Operation canceled by the user.');
    source = axios.CancelToken.source();
  };

  useEffect(() => {
    return () => {
      cancel();
      isMounted.current = false;
    };
  }, []);

  return [getData, { cancel, data, error, loading }];
}

export default useBaseAxios;