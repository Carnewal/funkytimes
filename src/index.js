import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import requestHandler from './service/requestHandler';
import 'moment/locale/nl-be';
import 'antd/dist/antd.css';
import './styles.css';
import { extendMoment } from 'moment-range';
import Moment from 'moment';
import {
  TimePicker,
  DatePicker,
  Steps,
  Button,
  Icon,
  Divider,
  List,
  Select,
} from 'antd';
import Header from './ui/Header';
const moment = extendMoment(Moment);
const { Step } = Steps;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Start up the glitch server faster :-)
requestHandler.get('/status').then(res => console.log(res));

const format = 'HH:mm';

function App() {
  const [state, setState] = useState({
    cookie: '',
    from: '08:00',
    to: '17:00',
    project: undefined,
    task: undefined,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState({});

  const onChangeEvent = transformer => ({ target: { name, value } }) =>
    onChange(transformer)({ name, value });

  const onChange = transformer => ({ name, value }) => {
    setState({
      ...state,
      [name]:
        transformer && typeof transformer === 'function'
          ? transformer(value)
          : value,
    });
  };

  const getProjectData = async () => {
    setState({ ...state /* , project: undefined, task: undefined */ });
    const { data } = await requestHandler.get(`/inside/${state.cookie}`);
    setProjectData(data);
  };

  // Update the current step
  useEffect(() => {
    if (state.task && state.to && state.dateRange) {
      setCurrentStep(5);
    } else if (state.task && state.to) {
      setCurrentStep(4);
    } else if (state.task) {
      setCurrentStep(3);
    } else if (state.project) {
      setCurrentStep(2);
    } else if (state.cookie && Object.keys(projectData).length) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
    }
  }, [projectData, state]);

  useEffect(() => {
    if (state.cookie && state.cookie.includes('PHPSESSID')) {
      getProjectData();
    }
  }, [state.cookie]);

  const tasks = useMemo(() => {
    const project = projectData && projectData[state.project];
    return project && project.tasks ? project.tasks : {};
  }, [projectData, state.project]);

  const [entries, setEntries] = useState([]);

  const createEntries = () => {
    const { dateRange, cookie, ...rest } = state;
    const dates = Array.from(
      moment
        .range(...dateRange)
        .snapTo('day')
        .by('days')
    );
    setEntries(
      dates.map(date => ({
        date,
        ...rest,
      }))
    );
  };

  const removeEntry = i => () => {
    setEntries(entries.slice(0, i).concat(entries.slice(i + 1)));
  };

  const submitEntries = async () => {
    const submitData = entries.map(e => ({
      ...e,
      date: e.date.format('YYYY-MM-DD'),
      projectName: projectData[e.project].name,
    }));
    const result = await requestHandler.post('/timeentries', {
      body: { entries: submitData, cookie: state.cookie },
    });
  };

  const steps = [
    {
      title: 'Paste your cookie',
      description: (
        <div>
          <p>
            Chrome devtools > Network tab > Select any request > Headers tab >
            Copy "Cookie: ..." from request headers.
          </p>
          <input
            autoFocus={false}
            id="cookie"
            name="cookie"
            value={state.cookie}
            onChange={onChangeEvent(value =>
              value.replace('Cookie:', '').trim()
            )}
            placeholder="PHPSESSID=12345;"
          />
        </div>
      ),
    },
    {
      title: `Select project (${Object.keys(projectData).length})`,
      description: (
        <Select
          labelInValue
          style={{ width: '20em' }}
          onChange={({ key, label }) =>
            onChange()({ name: 'project', value: key })
          }>
          {Object.keys(projectData).length
            ? Object.entries(projectData).map(([k, v]) => (
                <Option value={k.toString()}>{v.name}</Option>
              ))
            : null}
        </Select>
      ),
    },
    {
      title: `Select task (${Object.keys(tasks).length})`,
      description: (
        <Select
          labelInValue
          style={{ width: '20em' }}
          onChange={({ key, label }) =>
            onChange()({ name: 'task', value: key })
          }>
          {Object.entries(tasks).map(([k, [name]]) => (
            <Option value={k.toString()}>{name}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Select hour range',
      description: (
        <div>
          <TimePicker
            style={{ width: '11em' }}
            defaultValue={moment(state.from, format)}
            format={format}
            onChange={(moment, value) => onChange()({ name: 'from', value })}
          />
          {' - '}
          <TimePicker
            style={{ width: '11em' }}
            defaultValue={moment(state.to, format)}
            format={format}
            onChange={(moment, value) => onChange()({ name: 'to', value })}
          />
        </div>
      ),
    },
    {
      title: 'Select date range',
      description: (
        <div>
          <div>
            <RangePicker
              onChange={value => onChange()({ name: 'dateRange', value })}
            />
          </div>
        </div>
      ),
    },

    {
      title: 'Preview, Edit and Confirm',
      description: (
        <div>
          {currentStep > 4 && (
            <div>
              <Button type="primary" onClick={createEntries}>
                Create Preview
                <Icon type="right" />
              </Button>
            </div>
          )}
          <Divider />
          <div>
            The following data will be created:
            <List
              itemLayout="horizontal"
              dataSource={entries}
              renderItem={(item, i) => (
                <List.Item
                  actions={[<Button onClick={removeEntry(i)}>remove</Button>]}>
                  <div>{item.date.format('DD/MM/YYYY')}</div>
                </List.Item>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Create',
      description: (
        <Button type="primary" onClick={submitEntries}>
          Submit
        </Button>
      ),
    },
  ];

  return (
    <div className="App">
      <Header />
      <div className="steps-container">
        <Steps direction="vertical" current={currentStep}>
          {steps.map(step => (
            <Step {...step} />
          ))}
        </Steps>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
