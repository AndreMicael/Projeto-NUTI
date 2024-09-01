import './App.css';
import axios from 'axios';
import { useState } from 'react';
import LoadIcon from '../assets/loading.png';
import { toast } from 'react-toastify';

function App() {
   // Hooks utilzados para controlar as variáveis que usaremos no projeto
  // 1. A variável data é utilizada para armazenar os dados que iremos consumir na API
  // 2. A variável loading é utilizada para ajudar a informar ao usuário que a busca dos dados foi iniciada.
  // 3. As variáveis cnpj, dataini, datafim são usadas para armazenar os dados inseridos pelo usuário nos inputs do formulário e comunicar esses dados com a API.
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [dataini, setDataIni] = useState('');
  const [datafim, setDataFim] = useState('');

  // Função para converter a data no formato yyyy-MM-dd para yyyyMMdd
  const formatarDataParaAPI = (dateString) => {
    return dateString.replace(/-/g, '');
  };

  // Função para formatar a data para exibição
  const formatarData = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Função para converter números em formato de moeda
  const converterMoeda = (num) => {
    return 'R$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Função para verificar se a data está dentro do intervalo
  const isDataDentroDoIntervalo = (dataInicial, intervaloInicio, intervaloFim) => {
    return dataInicial >= intervaloInicio && dataInicial <= intervaloFim;
  };

  // Função de requisição à API
  const fetchData = () => {
    setLoading(true); // Inicia o carregamento
    axios.get('https://pncp.gov.br/api/consulta/v1/contratos', {
      params: {
        dataInicial: formatarDataParaAPI(dataini),
        dataFinal: formatarDataParaAPI(datafim),
        cnpjOrgao: cnpj.replace(/\D/g, ''),
        pagina: 10
      }
    })
    .then(response => {
      // Filtra os contratos para incluir apenas aqueles cuja data de vigência inicial esteja no intervalo solicitado
      const contratosFiltrados = response.data.data.filter(contrato => {
        const dataInicialContrato = contrato.dataVigenciaInicio.replace(/-/g, '');
        const intervaloInicio = formatarDataParaAPI(dataini);
        const intervaloFim = formatarDataParaAPI(datafim);
        return isDataDentroDoIntervalo(dataInicialContrato, intervaloInicio, intervaloFim);
      });
      setData({ ...response.data, data: contratosFiltrados });
    })
    .catch(error => console.error('Erro ao buscar dados:', error))
    .finally(() => {
      setLoading(false);
    });
  };

  const handleForm = (e) => {
    e.preventDefault();
    if (!cnpj || !dataini || !datafim) {
      toast.error('Por favor, preencha todos os campos!');
      return;
    }
    fetchData();
  };

  // Soma dos valores iniciais dos contratos.
  const somaValoresIniciais = data ? data.data.reduce((acc, contrato) => acc + contrato.valorInicial, 0) : 0;

  return (
    <>
      <h1 className='text-xl font-bold mb-5'>Consulta de Contratos</h1>
      <form className='grid  gap-2 justify-center'>
        <label className='text-sm font-bold'>CNPJ: </label>
        <input className='w-[30vw]' placeholder='00.000.000/0000-00' onChange={(e) => setCnpj(e.target.value)} type='text' maxLength="14" required />

        <label className='text-sm font-bold'>Data de Início: </label>
        <input onChange={(e) => setDataIni(e.target.value)} id="date" type="date" required />

        <label className='text-sm font-bold'>Data Final: </label>
        <input onChange={(e) => setDataFim(e.target.value)} id="date" type="date" required />
      </form>

      <button
        className='mt-5 mb-5 focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium 
      rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800'
        onClick={handleForm}
        disabled={loading}
      >
        {loading ? 'Carregando...' : 'Carregar Contratos'}
      </button>

      {loading ? (
        <div className='LoadingContainer'><img className='loadingIcon' src={LoadIcon} alt="Ícone de Loading" /></div>
      ) : data ? (
        <>
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-xs text-left rtl:text-right text-gray-500 dark:text-gray-400 ">
              <thead className="text-xs text-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3 bg-green-100 dark:bg-gray-800">Razão Social</th>
                  <th scope="col" className="px-6 bg-green-100 py-3">Data de Vigência Inicial</th>
                  <th scope="col" className="px-6 py-3 bg-green-100 dark:bg-gray-800">Data de Vigência Final</th>
                  <th scope="col" className="px-6 bg-green-100 py-3 whitespace-wrap">Objeto do Contrato</th>
                  <th scope="col" className="px-6 py-3 bg-green-100 whitespace-wrap dark:bg-gray-800">Valor Inicial do Contrato</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((contrato, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                    <td scope="row" className="px-6 py-4 text-gray-900 whitespace-wrap bg-green-50 dark:text-white dark:bg-gray-800">
                      {contrato.orgaoEntidade.razaoSocial}
                    </td>
                    <td className="px-6 bg-green-50 py-4">{formatarData(contrato.dataVigenciaInicio)}</td>
                    <td className="px-6 py-4 bg-green-50 dark:bg-gray-800">{formatarData(contrato.dataVigenciaFim)}</td>
                    <td className="px-2 bg-green-50 py-4 whitespace-wrap text-wrap">{contrato.objetoContrato}</td>
                    <td className="px-6 py-4 text-xs bg-green-50 dark:bg-gray-800">{converterMoeda(contrato.valorInicial)}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-gray-300 dark:border-gray-700">
                  <td colSpan="4" className="px-6 text-green-800 py-4 bg-green-200 dark:bg-gray-800">Total</td>
                  {/* Soma dos valores iniciais */}
                  <td className="px-6 py-4 bg-green-200 text-green-800 dark:bg-gray-800">{converterMoeda(somaValoresIniciais)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p></p>
      )}
    </>
  );
}

export default App;
