import { dirname } from "path";

import * as React from "react";
import styled from "styled-components";
import { selectors } from "@nteract/core";
import { ContentRef, AppState } from "@nteract/core";
import { LoadingIcon, SavingIcon, ErrorIcon } from "@nteract/iron-icons";
import { connect } from "react-redux";
import { FormGroup } from "@blueprintjs/core";
import { Classes } from "@blueprintjs/core";
import * as actions from "@nteract/core";

import { ThemedLogo } from "../../components/themed-logo";
import { Nav, NavSection } from "../../components/nav";
import LastSaved from "../../components/last-saved";
import { default as Notebook } from "../notebook";

import * as TextFile from "./text-file";

const urljoin = require("url-join");

const PaddedContainer = styled.div`
  padding-left: var(--nt-spacing-l, 10px);
  padding-top: var(--nt-spacing-m, 10px);
  padding-right: var(--nt-spacing-m, 10px);
`;

const JupyterExtensionContainer = styled.div`
  display: flex;
  flex-flow: column;
  align-items: stretch;
  height: -webkit-fill-available;
`;

const JupyterExtensionChoiceContainer = styled.div`
  flex: 1 1 auto;
  overflow: auto;
`;

type FileProps = {
  type: "notebook" | "file" | "dummy";
  contentRef: ContentRef;
  baseDir: string;
  appBase: string;
  displayName?: string;
  mimetype?: string | null;
  lastSavedStatement: string;
  saving: boolean;
  loading: boolean;
  error?: object | null;
};

export class File extends React.PureComponent<FileProps, *> {

  render() {
    // Determine the file handler
    let choice = null;
    const icon = this.props.saving ? (
      <SavingIcon />
    ) : this.props.error ? (
      <ErrorIcon />
    ) : this.props.loading ? (
      <LoadingIcon />
    ) : (
      ""
    );

    // notebooks don't report a mimetype so we'll use the content.type
    if (this.props.type === "notebook") {
      choice = <Notebook contentRef={this.props.contentRef} />;
    } else if (this.props.type === "dummy") {
      choice = null;
    } else if (
      this.props.mimetype == null ||
      !TextFile.handles(this.props.mimetype)
    ) {
      // TODO: Redirect to /files/ endpoint for them to download the file or view
      //       as is
      choice = (
        <PaddedContainer>
          <pre>Can not render this file type</pre>
        </PaddedContainer>
      );
    } else {
      choice = <TextFile.default contentRef={this.props.contentRef} />;
    }

    // Right now we only handle one kind of editor
    // If/when we support more modes, we would case them off here
    return (
      <React.Fragment>
        <JupyterExtensionContainer>
          <Nav contentRef={this.props.contentRef}>
            <NavSection>
              <a
                href={urljoin(this.props.appBase, this.props.baseDir)}
                title="Home"
              >
                <ThemedLogo />
              </a>
              {/* Uncontrolled input */}
              <FormGroup
                disabled={false}
                intent={"primary"} 
              >
                <input 
                  className={Classes.EDITABLE_TEXT_INPUT}
                  type="text" 
                  ref={input => this.ref = input} 
                  defaultValue={this.props.displayName}
                  spellCheck={false}
                  onBlur={(event) => {
                      event.preventDefault();

                      return this.props.updateTitle({
                        filepath: `/${this.ref.value}`,
                        contentRef: this.props.contentRef
                      })
                    }
                  }
                /> 
              </FormGroup>
            </NavSection>
            <NavSection>
              <span className="icon">{icon}</span>
              <LastSaved contentRef={this.props.contentRef} />
            </NavSection>
          </Nav>
          <JupyterExtensionChoiceContainer>
            {choice}
          </JupyterExtensionChoiceContainer>
        </JupyterExtensionContainer>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (
  state: AppState,
  ownProps: { contentRef: ContentRef; appBase: string }
): FileProps => {
  const content = selectors.content(state, ownProps);

  if (!content || content.type === "directory") {
    throw new Error(
      "The file component should only be used with files and notebooks"
    );
  }

  const comms = selectors.communication(state, ownProps);
  if (!comms) {
    throw new Error("CommunicationByRef information not found");
  }

  return {
    type: content.type,
    mimetype: content.mimetype,
    contentRef: ownProps.contentRef,
    lastSavedStatement: "recently",
    appBase: ownProps.appBase,
    baseDir: dirname(content.filepath),
    displayName: content.filepath.split("/").pop(),
    saving: comms.saving,
    loading: comms.loading,
    error: comms.error
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  updateTitle: (value: object) => dispatch(actions.changeContentName(value))
});

export const ConnectedFile = connect(
  mapStateToProps,
  mapDispatchToProps
)(File);

export default ConnectedFile;
