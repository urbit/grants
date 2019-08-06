import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Steps, Icon } from 'antd';
import qs from 'query-string';
import { withRouter, RouteComponentProps } from 'react-router';
import { History } from 'history';
import { debounce } from 'underscore';
import { jumpToTop } from 'utils/misc';
import Basics from './Basics';
import Team from './Team';
import Details from './Details';
import Milestones from './Milestones';
import Review from './Review';
import Preview from './Preview';
import Final from './Final';
import SubmitWarningModal from './SubmitWarningModal';
import createExampleProposal from './example';
import { createActions } from 'modules/create';
import { ProposalDraft } from 'types';
import { getCreateErrors } from 'modules/create/utils';
import { AppState } from 'store/reducers';
import './index.less';

export enum CREATE_STEP {
  BASICS = 'BASICS',
  TEAM = 'TEAM',
  DETAILS = 'DETAILS',
  MILESTONES = 'MILESTONES',
  REVIEW = 'REVIEW',
}

const STEP_ORDER = [
  CREATE_STEP.BASICS,
  CREATE_STEP.TEAM,
  CREATE_STEP.DETAILS,
  CREATE_STEP.MILESTONES,
  CREATE_STEP.REVIEW,
];

interface StepInfo {
  short: string;
  help: React.ReactNode;
  component: any;
}
const STEP_INFO: { [key in CREATE_STEP]: StepInfo } = {
  [CREATE_STEP.BASICS]: {
    short: 'Basics',
    help:
      'You don’t have to fill out everything at once right now, you can come back later.',
    component: Basics,
  },
  [CREATE_STEP.TEAM]: {
    short: 'Team',
    help:
      'More team members, real names, and linked social accounts adds legitimacy to your proposal',
    component: Team,
  },
  [CREATE_STEP.DETAILS]: {
    short: 'Details',
    help:
      'Make sure people know what you’re building, why you’re qualified, and where the money’s going',
    component: Details,
  },
  [CREATE_STEP.MILESTONES]: {
    short: 'Milestones',
    help:
      'Contributors are more willing to fund proposals with funding spread across multiple milestones',
    component: Milestones,
  },
  [CREATE_STEP.REVIEW]: {
    short: 'Review',
    help: 'You’ll get a chance to preview your proposal next before you publish it',
    component: Review,
  },
};

interface StateProps {
  form: AppState['create']['form'];
  isSavingDraft: AppState['create']['isSavingDraft'];
  hasSavedDraft: AppState['create']['hasSavedDraft'];
  saveDraftError: AppState['create']['saveDraftError'];
}

interface DispatchProps {
  updateForm: typeof createActions['updateForm'];
}

type Props = StateProps & DispatchProps & RouteComponentProps<any>;

interface State {
  step: CREATE_STEP;
  isPreviewing: boolean;
  isShowingSubmitWarning: boolean;
  isSubmitting: boolean;
  isExample: boolean;
}

class CreateFlow extends React.Component<Props, State> {
  private historyUnlisten: () => void;
  private debouncedUpdateForm: (form: Partial<ProposalDraft>) => void;

  constructor(props: Props) {
    super(props);
    const searchValues = qs.parse(props.location.search);
    const queryStep = searchValues.step ? searchValues.step.toUpperCase() : null;
    const isPreviewing = queryStep === CREATE_STEP.REVIEW && !!searchValues.preview;
    const step =
      queryStep && CREATE_STEP[queryStep]
        ? (CREATE_STEP[queryStep] as CREATE_STEP)
        : CREATE_STEP.BASICS;
    this.state = {
      step,
      isPreviewing,
      isSubmitting: false,
      isExample: false,
      isShowingSubmitWarning: false,
    };
    this.debouncedUpdateForm = debounce(this.updateForm, 800);
    this.historyUnlisten = this.props.history.listen(this.handlePop);
  }

  componentWillUnmount() {
    if (this.historyUnlisten) {
      this.historyUnlisten();
    }
  }

  render() {
    const { isSavingDraft, saveDraftError } = this.props;
    const { step, isPreviewing, isSubmitting, isShowingSubmitWarning } = this.state;

    const info = STEP_INFO[step];
    const currentIndex = STEP_ORDER.indexOf(step);
    const isLastStep = STEP_ORDER.indexOf(step) === STEP_ORDER.length - 1;
    const StepComponent = info.component;

    let content;
    let showFooter = true;
    if (isSubmitting) {
      content = <Final goBack={this.cancelSubmit} />;
      showFooter = false;
    } else if (isPreviewing) {
      content = <Preview />;
      showFooter = false;
    } else {
      // Antd definitions are missing `onClick` for step, even though it works.
      const Step = Steps.Step as any;
      content = (
        <div className="CreateFlow">
          <div className="CreateFlow-header">
            <Steps current={currentIndex}>
              {STEP_ORDER.slice(0, 5).map(s => (
                <Step
                  key={s}
                  title={STEP_INFO[s].short}
                  onClick={() => this.setStep(s)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Steps>
          </div>
          <div className="CreateFlow-content">
            <StepComponent
              proposalId={this.props.form && this.props.form.id}
              initialState={this.props.form}
              updateForm={this.debouncedUpdateForm}
              setStep={this.setStep}
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        {content}
        {showFooter && (
          <div className="CreateFlow-footer">
            {isLastStep ? (
              <>
                <button
                  className="CreateFlow-footer-button"
                  key="preview"
                  onClick={this.togglePreview}
                >
                  {isPreviewing ? 'Back to Edit' : 'Preview'}
                </button>
                <button
                  className="CreateFlow-footer-button is-primary"
                  key="submit"
                  onClick={this.openPublishWarning}
                  disabled={this.checkFormErrors()}
                >
                  Submit
                </button>
              </>
            ) : (
              <>
                <div className="CreateFlow-footer-help">{info.help}</div>
                <button
                  className="CreateFlow-footer-button"
                  key="next"
                  onClick={this.nextStep}
                >
                  Continue <Icon type="right-circle-o" />
                </button>
              </>
            )}

            {(process.env.NODE_ENV !== 'production' || process.env.DEMO) && (
              <button className="CreateFlow-footer-example" onClick={this.fillInExample}>
                <Icon type="fast-forward" />
              </button>
            )}
          </div>
        )}
        {isSavingDraft ? (
          <div className="CreateFlow-draftNotification">Saving draft...</div>
        ) : (
          saveDraftError && (
            <div className="CreateFlow-draftNotification is-error">
              Failed to save draft!
              <br />
              {saveDraftError}
            </div>
          )
        )}
        <SubmitWarningModal
          proposal={this.props.form}
          isVisible={isShowingSubmitWarning}
          handleClose={this.closePublishWarning}
          handleSubmit={this.startSubmit}
        />
      </div>
    );
  }

  private updateForm = (form: Partial<ProposalDraft>) => {
    this.props.updateForm(form);
  };

  private setStep = (step: CREATE_STEP, skipHistory?: boolean) => {
    this.setState({ step });
    if (!skipHistory) {
      const { history, location } = this.props;
      history.push(`${location.pathname}?step=${step.toLowerCase()}`);
    }
    jumpToTop();
  };

  private nextStep = () => {
    const idx = STEP_ORDER.indexOf(this.state.step);
    if (idx !== STEP_ORDER.length - 1) {
      this.setStep(STEP_ORDER[idx + 1]);
    }
  };

  private togglePreview = () => {
    const isPreviewing = !this.state.isPreviewing;
    this.setState({ isPreviewing });
    if (isPreviewing) {
      this.props.history.push(`${location.pathname}?step=review&preview=1`);
    } else {
      this.props.history.push(`${location.pathname}?step=review`);
    }
    jumpToTop();
  };

  private startSubmit = () => {
    this.setState({
      isSubmitting: true,
      isShowingSubmitWarning: false,
    });
  };

  private checkFormErrors = () => {
    if (!this.props.form) {
      return true;
    }
    const errors = getCreateErrors(this.props.form);
    return !!Object.keys(errors).length;
  };

  private handlePop: History.LocationListener = (location, action) => {
    if (action === 'POP') {
      const searchValues = qs.parse(location.search);
      const urlStep = searchValues.step && searchValues.step.toUpperCase();
      if (urlStep && CREATE_STEP[urlStep]) {
        this.setStep(urlStep as CREATE_STEP, true);
      } else {
        this.setStep(CREATE_STEP.BASICS, true);
      }

      if (urlStep === CREATE_STEP.REVIEW) {
        this.setState({ isPreviewing: !!searchValues.preview });
      } else {
        this.setState({ isPreviewing: false });
      }
    }
  };

  private openPublishWarning = () => {
    this.setState({ isShowingSubmitWarning: true });
  };

  private closePublishWarning = () => {
    this.setState({ isShowingSubmitWarning: false });
  };

  private cancelSubmit = () => {
    this.setState({ isSubmitting: false });
  };

  private fillInExample = () => {
    this.updateForm(createExampleProposal());
    setTimeout(() => {
      this.setState({
        isExample: true,
        step: CREATE_STEP.REVIEW,
      });
    }, 50);
  };
}

const withConnect = connect<StateProps, DispatchProps, {}, AppState>(
  (state: AppState) => ({
    form: state.create.form,
    isSavingDraft: state.create.isSavingDraft,
    hasSavedDraft: state.create.hasSavedDraft,
    saveDraftError: state.create.saveDraftError,
  }),
  {
    updateForm: createActions.updateForm,
  },
);

export default compose<Props, {}>(
  withRouter,
  withConnect,
)(CreateFlow);
